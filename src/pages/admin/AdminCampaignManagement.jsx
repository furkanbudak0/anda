import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlayIcon,
  StopIcon,
  GiftIcon,
  CalendarIcon,
  TagIcon,
  PercentIcon,
  CurrencyDollarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";
import NavBar from "../../components/NavBar";
import Spinner from "../../components/Spinner";
import { formatPrice, formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";

const campaignTypes = [
  { value: "discount", label: "İndirim Kampanyası", icon: PercentIcon },
  { value: "promotion", label: "Promosyon", icon: GiftIcon },
  { value: "featured", label: "Öne Çıkarılan", icon: TagIcon },
  { value: "seasonal", label: "Sezonsal", icon: CalendarIcon },
];

export default function AdminCampaignManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    campaign_type: "discount",
    target_audience: {},
    discount_percentage: 0,
    discount_amount: 0,
    start_date: "",
    end_date: "",
    max_uses: null,
    is_active: false,
  });

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Create/Update campaign mutation
  const saveCampaignMutation = useMutation({
    mutationFn: async (campaignData) => {
      const payload = {
        ...campaignData,
        created_by: user.id,
        current_uses: 0,
      };

      if (editingCampaign) {
        const { data, error } = await supabase
          .from("admin_campaigns")
          .update(payload)
          .eq("id", editingCampaign.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("admin_campaigns")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-campaigns"]);
      toast.success(
        editingCampaign ? "Kampanya güncellendi!" : "Kampanya oluşturuldu!"
      );
      resetForm();
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId) => {
      const { error } = await supabase
        .from("admin_campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-campaigns"]);
      toast.success("Kampanya silindi!");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  // Toggle campaign status mutation
  const toggleCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, isActive }) => {
      const { error } = await supabase
        .from("admin_campaigns")
        .update({ is_active: isActive })
        .eq("id", campaignId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-campaigns"]);
      toast.success("Kampanya durumu güncellendi!");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      campaign_type: "discount",
      target_audience: {},
      discount_percentage: 0,
      discount_amount: 0,
      start_date: "",
      end_date: "",
      max_uses: null,
      is_active: false,
    });
    setEditingCampaign(null);
    setIsModalOpen(false);
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      title: campaign.title,
      description: campaign.description || "",
      campaign_type: campaign.campaign_type,
      target_audience: campaign.target_audience || {},
      discount_percentage: campaign.discount_percentage || 0,
      discount_amount: campaign.discount_amount || 0,
      start_date: campaign.start_date?.split("T")[0] || "",
      end_date: campaign.end_date?.split("T")[0] || "",
      max_uses: campaign.max_uses,
      is_active: campaign.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Kampanya başlığı zorunludur!");
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error("Başlangıç ve bitiş tarihleri zorunludur!");
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast.error("Bitiş tarihi başlangıç tarihinden sonra olmalıdır!");
      return;
    }

    saveCampaignMutation.mutate(formData);
  };

  const handleDelete = (campaignId) => {
    if (window.confirm("Bu kampanyayı silmek istediğinizden emin misiniz?")) {
      deleteCampaignMutation.mutate(campaignId);
    }
  };

  const handleToggleStatus = (campaign) => {
    toggleCampaignMutation.mutate({
      campaignId: campaign.id,
      isActive: !campaign.is_active,
    });
  };

  const getCampaignTypeLabel = (type) => {
    const campaignType = campaignTypes.find((ct) => ct.value === type);
    return campaignType ? campaignType.label : type;
  };

  const getCampaignTypeIcon = (type) => {
    const campaignType = campaignTypes.find((ct) => ct.value === type);
    return campaignType ? campaignType.icon : GiftIcon;
  };

  const getStatusBadge = (campaign) => {
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);

    if (!campaign.is_active) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Pasif
        </span>
      );
    }

    if (now < startDate) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          Beklemede
        </span>
      );
    }

    if (now > endDate) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Süresi Doldu
        </span>
      );
    }

    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        Aktif
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Kampanya Yönetimi
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Platform kampanyalarını oluşturun ve yönetin.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Yeni Kampanya
            </button>
          </div>

          {/* Campaigns Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <GiftIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Henüz kampanya bulunmuyor
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                İlk kampanyanızı oluşturmak için yukarıdaki butona tıklayın.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => {
                const IconComponent = getCampaignTypeIcon(
                  campaign.campaign_type
                );
                return (
                  <div
                    key={campaign.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {campaign.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getCampaignTypeLabel(campaign.campaign_type)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(campaign)}
                    </div>

                    {campaign.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {campaign.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CalendarIcon className="w-4 h-4" />
                        <span>
                          {formatDate(campaign.start_date)} -{" "}
                          {formatDate(campaign.end_date)}
                        </span>
                      </div>

                      {(campaign.discount_percentage ||
                        campaign.discount_amount) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          {campaign.discount_percentage ? (
                            <>
                              <PercentIcon className="w-4 h-4" />
                              <span>
                                %{campaign.discount_percentage} indirim
                              </span>
                            </>
                          ) : (
                            <>
                              <CurrencyDollarIcon className="w-4 h-4" />
                              <span>
                                {formatPrice(campaign.discount_amount)} indirim
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {campaign.max_uses && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <UsersIcon className="w-4 h-4" />
                          <span>
                            {campaign.current_uses || 0} / {campaign.max_uses}{" "}
                            kullanım
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setIsDetailModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(campaign)}
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleToggleStatus(campaign)}
                        className={`p-2 rounded-lg ${
                          campaign.is_active
                            ? "bg-red-100 text-red-600 hover:bg-red-200"
                            : "bg-green-100 text-green-600 hover:bg-green-200"
                        }`}
                      >
                        {campaign.is_active ? (
                          <StopIcon className="w-4 h-4" />
                        ) : (
                          <PlayIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Campaign Form Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingCampaign ? "Kampanyayı Düzenle" : "Yeni Kampanya"}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Kampanya Başlığı
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Açıklama
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Kampanya Türü
                      </label>
                      <select
                        value={formData.campaign_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            campaign_type: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {campaignTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Maksimum Kullanım
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.max_uses || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            max_uses: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Sınırsız"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        İndirim Oranı (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discount_percentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount_percentage:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        İndirim Tutarı (₺)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discount_amount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount_amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Başlangıç Tarihi
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            start_date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bitiş Tarihi
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) =>
                          setFormData({ ...formData, end_date: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_active: e.target.checked,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Kampanyayı hemen aktifleştir
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={saveCampaignMutation.isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saveCampaignMutation.isLoading
                        ? "Kaydediliyor..."
                        : "Kaydet"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Campaign Detail Modal */}
          {isDetailModalOpen && selectedCampaign && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Kampanya Detayları
                  </h3>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {selectedCampaign.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedCampaign.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Kampanya Türü
                      </p>
                      <p className="font-medium">
                        {getCampaignTypeLabel(selectedCampaign.campaign_type)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Durum
                      </p>
                      {getStatusBadge(selectedCampaign)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Başlangıç Tarihi
                      </p>
                      <p className="font-medium">
                        {formatDate(selectedCampaign.start_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Bitiş Tarihi
                      </p>
                      <p className="font-medium">
                        {formatDate(selectedCampaign.end_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Kullanım
                      </p>
                      <p className="font-medium">
                        {selectedCampaign.current_uses || 0}
                        {selectedCampaign.max_uses
                          ? ` / ${selectedCampaign.max_uses}`
                          : " (Sınırsız)"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        İndirim
                      </p>
                      <p className="font-medium">
                        {selectedCampaign.discount_percentage
                          ? `%${selectedCampaign.discount_percentage}`
                          : selectedCampaign.discount_amount
                          ? formatPrice(selectedCampaign.discount_amount)
                          : "Yok"}
                      </p>
                    </div>
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
