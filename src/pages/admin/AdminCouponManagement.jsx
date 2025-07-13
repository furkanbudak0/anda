import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../services/supabase";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  CalendarIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import LoadingFallback from "../../components/LoadingFallback";
import ConfirmationModal from "../../components/ConfirmationModal";

export default function AdminCouponManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteCoupon, setDeleteCoupon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    type: "percentage",
    value: 0,
    min_amount: 0,
    max_discount: 0,
    usage_limit: 0,
    start_date: "",
    end_date: "",
    is_active: true,
    category_ids: [],
    user_ids: [],
    exclude_sale_items: false,
    first_order_only: false,
  });

  const queryClient = useQueryClient();

  // Fetch coupons from Supabase
  const {
    data: coupons = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-coupons", searchTerm, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from("campaigns")
        .select(
          `
          *,
          campaign_products(
            product:products(name)
          )
        `
        )
        .order("created_at", { ascending: false });

      // Filter by search term
      if (searchTerm) {
        query = query.or(
          `code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        );
      }

      // Filter by status
      if (filterStatus !== "all") {
        if (filterStatus === "active") {
          query = query.eq("status", "active");
        } else if (filterStatus === "expired") {
          query = query.or(
            "status.eq.expired,end_date.lt." + new Date().toISOString()
          );
        } else if (filterStatus === "inactive") {
          query = query.eq("status", "inactive");
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching coupons:", error);
        throw error;
      }

      return data.map((coupon) => ({
        id: coupon.id,
        code: coupon.code || `COUPON${coupon.id.slice(0, 8)}`,
        description: coupon.description || coupon.title,
        type: coupon.discount_type === "fixed_amount" ? "fixed" : "percentage",
        value: coupon.discount_value || coupon.discount_percentage || 0,
        min_amount: coupon.min_order_amount || 0,
        max_discount: coupon.max_discount_amount || 0,
        usage_limit: coupon.usage_limit || 0,
        used_count: coupon.usage_count || 0,
        start_date: coupon.start_date,
        end_date: coupon.end_date,
        is_active: coupon.status === "active",
        created_at: coupon.created_at,
        total_savings:
          (coupon.usage_count || 0) *
          (coupon.discount_value || coupon.discount_percentage || 0),
        category_ids: [],
        user_ids: [],
        exclude_sale_items: false,
        first_order_only: false,
      }));
    },
  });

  // Add coupon mutation
  const addCouponMutation = useMutation({
    mutationFn: async (couponData) => {
      // Generate unique code if not provided
      if (!couponData.code) {
        couponData.code = `COUPON${Date.now()}`;
      }

      const campaignData = {
        title: couponData.description,
        description: couponData.description,
        type: "discount",
        discount_type:
          couponData.type === "fixed" ? "fixed_amount" : "percentage",
        discount_value: couponData.type === "fixed" ? couponData.value : null,
        discount_percentage:
          couponData.type === "percentage" ? couponData.value : null,
        min_order_amount: couponData.min_amount || null,
        max_discount_amount: couponData.max_discount || null,
        usage_limit: couponData.usage_limit || null,
        code: couponData.code,
        status: couponData.is_active ? "active" : "inactive",
        start_date: couponData.start_date || new Date().toISOString(),
        end_date: couponData.end_date,
      };

      const { data, error } = await supabase
        .from("campaigns")
        .insert(campaignData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-coupons"]);
      toast.success("Kupon başarıyla eklendi!");
      setShowAddModal(false);
      setNewCoupon({
        code: "",
        description: "",
        type: "percentage",
        value: 0,
        min_amount: 0,
        max_discount: 0,
        usage_limit: 0,
        start_date: "",
        end_date: "",
        is_active: true,
        category_ids: [],
        user_ids: [],
        exclude_sale_items: false,
        first_order_only: false,
      });
    },
    onError: (error) => {
      console.error("Error adding coupon:", error);
      toast.error("Kupon eklenirken hata oluştu!");
    },
  });

  // Update coupon mutation
  const updateCouponMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const updateData = {
        title: data.description,
        description: data.description,
        discount_type: data.type === "fixed" ? "fixed_amount" : "percentage",
        discount_value: data.type === "fixed" ? data.value : null,
        discount_percentage: data.type === "percentage" ? data.value : null,
        min_order_amount: data.min_amount || null,
        max_discount_amount: data.max_discount || null,
        usage_limit: data.usage_limit || null,
        code: data.code,
        status: data.is_active ? "active" : "inactive",
        start_date: data.start_date,
        end_date: data.end_date,
      };

      const { error } = await supabase
        .from("campaigns")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-coupons"]);
      toast.success("Kupon başarıyla güncellendi!");
      setEditingCoupon(null);
    },
    onError: (error) => {
      console.error("Error updating coupon:", error);
      toast.error("Kupon güncellenirken hata oluştu!");
    },
  });

  // Delete coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId) => {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", couponId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-coupons"]);
      toast.success("Kupon başarıyla silindi!");
    },
    onError: (error) => {
      console.error("Error deleting coupon:", error);
      toast.error("Kupon silinirken hata oluştu!");
    },
  });

  const handleAddCoupon = () => {
    if (!newCoupon.code.trim()) {
      toast.error("Kupon kodu gerekli!");
      return;
    }

    if (coupons.some((coupon) => coupon.code === newCoupon.code)) {
      toast.error("Bu kupon kodu zaten mevcut!");
      return;
    }

    addCouponMutation.mutate(newCoupon);
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setNewCoupon({
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      min_amount: coupon.min_amount,
      max_discount: coupon.max_discount,
      usage_limit: coupon.usage_limit,
      start_date: coupon.start_date?.split("T")[0] || "",
      end_date: coupon.end_date?.split("T")[0] || "",
      is_active: coupon.is_active,
      category_ids: coupon.category_ids || [],
      user_ids: coupon.user_ids || [],
      exclude_sale_items: coupon.exclude_sale_items || false,
      first_order_only: coupon.first_order_only || false,
    });
    setShowAddModal(true);
  };

  const handleUpdateCoupon = () => {
    if (!newCoupon.code.trim()) {
      toast.error("Kupon kodu gerekli!");
      return;
    }

    updateCouponMutation.mutate({
      id: editingCoupon.id,
      data: newCoupon,
    });
  };

  const handleDeleteCoupon = (couponId) => {
    setIsLoading(true);
    setTimeout(() => {
      setCoupons((prev) => prev.filter((coupon) => coupon.id !== couponId));
      setDeleteCoupon(null);
      setIsLoading(false);
      toast.success("Kupon başarıyla silindi!");
    }, 1000);
  };

  const handleDuplicateCoupon = (coupon) => {
    const duplicatedCoupon = {
      ...coupon,
      id: Date.now(),
      code: `${coupon.code}_COPY`,
      used_count: 0,
      total_savings: 0,
      created_at: new Date().toISOString(),
    };

    setCoupons((prev) => [...prev, duplicatedCoupon]);
    toast.success("Kupon başarıyla kopyalandı!");
  };

  const handleToggleActive = (coupon) => {
    updateCouponMutation.mutate({
      id: coupon.id,
      data: { ...coupon, is_active: !coupon.is_active },
    });
  };

  const generateCouponCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    setNewCoupon({ ...newCoupon, code: result });
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && coupon.is_active) ||
      (filterStatus === "inactive" && !coupon.is_active) ||
      (filterStatus === "expired" && new Date(coupon.end_date) < new Date());

    return matchesSearch && matchesStatus;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case "percentage":
        return <TagIcon className="w-4 h-4" />;
      case "fixed":
        return <TagIcon className="w-4 h-4" />;
      case "free_shipping":
        return <GiftIcon className="w-4 h-4" />;
      default:
        return <TagIcon className="w-4 h-4" />;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case "percentage":
        return "Yüzde";
      case "fixed":
        return "Sabit";
      case "free_shipping":
        return "Ücretsiz Kargo";
      default:
        return type;
    }
  };

  const getStatusColor = (coupon) => {
    const now = new Date();
    const endDate = new Date(coupon.end_date);

    if (!coupon.is_active) return "text-gray-500 bg-gray-100";
    if (endDate < now) return "text-red-600 bg-red-100";
    if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit)
      return "text-orange-600 bg-orange-100";
    return "text-green-600 bg-green-100";
  };

  const getStatusText = (coupon) => {
    const now = new Date();
    const endDate = new Date(coupon.end_date);

    if (!coupon.is_active) return "Pasif";
    if (endDate < now) return "Süresi Dolmuş";
    if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit)
      return "Limit Dolmuş";
    return "Aktif";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  };

  const totalStats = {
    totalCoupons: coupons.length,
    activeCoupons: coupons.filter((c) => c.is_active).length,
    totalUsage: coupons.reduce((sum, c) => sum + c.used_count, 0),
    totalSavings: coupons.reduce((sum, c) => sum + c.total_savings, 0),
  };

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kupon Yönetimi</h1>
          <p className="text-gray-600">
            İndirim kuponlarını yönetin ve analiz edin
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Kupon Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TagIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Kupon</p>
              <p className="text-xl font-semibold text-gray-900">
                {totalStats.totalCoupons}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aktif Kupon</p>
              <p className="text-xl font-semibold text-gray-900">
                {totalStats.activeCoupons}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Kullanım</p>
              <p className="text-xl font-semibold text-gray-900">
                {totalStats.totalUsage}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <GiftIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Tasarruf</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatCurrency(totalStats.totalSavings)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Kuponlar</h2>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Kupon kodu veya açıklama ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tüm Kuponlar</option>
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
                <option value="expired">Süresi Dolmuş</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kupon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tip
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Değer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanım
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Geçerlilik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {coupon.code}
                      </div>
                      <div className="text-sm text-gray-500">
                        {coupon.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(coupon.type)}
                      <span className="text-sm text-gray-900">
                        {getTypeText(coupon.type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {coupon.type === "percentage"
                      ? `%${coupon.value}`
                      : coupon.type === "fixed"
                      ? formatCurrency(coupon.value)
                      : "Ücretsiz Kargo"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {coupon.usage_limit > 0
                      ? `${coupon.used_count} / ${coupon.usage_limit}`
                      : coupon.used_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>{formatDate(coupon.start_date)}</div>
                      <div className="text-gray-500">
                        {formatDate(coupon.end_date)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        coupon
                      )}`}
                    >
                      {getStatusText(coupon)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        className={`p-1 rounded ${
                          coupon.is_active
                            ? "text-green-600 hover:bg-green-50"
                            : "text-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {coupon.is_active ? (
                          <EyeIcon className="w-4 h-4" />
                        ) : (
                          <EyeSlashIcon className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDuplicateCoupon(coupon)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditCoupon(coupon)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteCoupon(coupon)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddModal || editingCoupon) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCoupon ? "Kupon Düzenle" : "Yeni Kupon Ekle"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kupon Kodu *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCoupon.code}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="KUPON_KODU"
                  />
                  <button
                    type="button"
                    onClick={generateCouponCode}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Oluştur
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kupon Tipi *
                </label>
                <select
                  value={newCoupon.type}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="percentage">Yüzde İndirimi</option>
                  <option value="fixed">Sabit İndirim</option>
                  <option value="free_shipping">Ücretsiz Kargo</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={newCoupon.description}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Kupon açıklaması"
                />
              </div>

              {newCoupon.type !== "free_shipping" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {newCoupon.type === "percentage"
                      ? "İndirim Yüzdesi"
                      : "İndirim Tutarı"}{" "}
                    *
                  </label>
                  <input
                    type="number"
                    value={newCoupon.value}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        value: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={newCoupon.type === "percentage" ? "20" : "50"}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Tutar
                </label>
                <input
                  type="number"
                  value={newCoupon.min_amount}
                  onChange={(e) =>
                    setNewCoupon({
                      ...newCoupon,
                      min_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              {newCoupon.type === "percentage" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maksimum İndirim
                  </label>
                  <input
                    type="number"
                    value={newCoupon.max_discount}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        max_discount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanım Limiti
                </label>
                <input
                  type="number"
                  value={newCoupon.usage_limit}
                  onChange={(e) =>
                    setNewCoupon({
                      ...newCoupon,
                      usage_limit: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0 (sınırsız)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlangıç Tarihi *
                </label>
                <input
                  type="date"
                  value={newCoupon.start_date}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, start_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bitiş Tarihi *
                </label>
                <input
                  type="date"
                  value={newCoupon.end_date}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, end_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={newCoupon.is_active}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        is_active: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="is_active"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Aktif kupon
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="exclude_sale_items"
                    checked={newCoupon.exclude_sale_items}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        exclude_sale_items: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="exclude_sale_items"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    İndirimli ürünleri hariç tut
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="first_order_only"
                    checked={newCoupon.first_order_only}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        first_order_only: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="first_order_only"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Sadece ilk siparişte kullanılabilir
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCoupon(null);
                  setNewCoupon({
                    code: "",
                    description: "",
                    type: "percentage",
                    value: 0,
                    min_amount: 0,
                    max_discount: 0,
                    usage_limit: 0,
                    used_count: 0,
                    start_date: "",
                    end_date: "",
                    is_active: true,
                    category_ids: [],
                    user_ids: [],
                    exclude_sale_items: false,
                    first_order_only: false,
                  });
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={editingCoupon ? handleUpdateCoupon : handleAddCoupon}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingCoupon ? "Güncelle" : "Ekle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteCoupon && (
        <ConfirmationModal
          isOpen={!!deleteCoupon}
          onClose={() => setDeleteCoupon(null)}
          onConfirm={() => handleDeleteCoupon(deleteCoupon.id)}
          title="Kupon Sil"
          message={`"${deleteCoupon.code}" kuponunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Sil"
          cancelText="İptal"
          type="danger"
        />
      )}
    </div>
  );
}
