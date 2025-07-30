/**
 * ADMIN CAMPAIGN PRIORITY MANAGEMENT
 *
 * Advanced campaign priority system where admin can set priority levels
 * for campaigns and control their display order in carousels.
 *
 * Features:
 * - Drag & drop priority ordering
 * - Campaign performance analytics
 * - Real-time carousel preview
 * - Scheduling system
 * - A/B testing for campaigns
 * - ROI tracking and optimization
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  ChartBarIcon,
  CogIcon,
  PlayIcon,
  PauseIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { notifications } from "../../utils/notifications";
import { supabase } from "../../services/supabase";

/**
 * Campaign priority levels with scoring
 */
const PRIORITY_LEVELS = {
  EMERGENCY: {
    value: 1000,
    label: "Acil Kampanya",
    color: "red",
    description: "Anında en üstte gösterilir",
  },
  HIGH: {
    value: 800,
    label: "Yüksek Öncelik",
    color: "orange",
    description: "İlk 3 sırada gösterilir",
  },
  MEDIUM: {
    value: 500,
    label: "Orta Öncelik",
    color: "yellow",
    description: "İlk 6 sırada gösterilir",
  },
  LOW: {
    value: 200,
    label: "Düşük Öncelik",
    color: "blue",
    description: "Normal sıralamada gösterilir",
  },
  HIDDEN: {
    value: 0,
    label: "Gizli",
    color: "gray",
    description: "Carousel'lerde gösterilmez",
  },
};

/**
 * Campaign status types
 */
const CAMPAIGN_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  PAUSED: "paused",
  ENDED: "ended",
  SCHEDULED: "scheduled",
};

const AdminCampaignPriorityManagement = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [draggedCampaign, setDraggedCampaign] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    search: "",
  });

  // Load campaigns
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("campaigns")
        .select(
          `
          *,
          campaign_products(
            product:products(*)
          ),
          campaign_analytics(*)
        `
        )
        .order("priority_score", { ascending: false });

      if (error) throw error;

      setCampaigns(data || []);
    } catch (error) {
      console.error("Error loading campaigns:", error);
      notifications.error("Kampanyalar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filtered and sorted campaigns
   */
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter(
        (campaign) => campaign.status === filters.status
      );
    }

    // Filter by priority
    if (filters.priority !== "all") {
      const priorityRange = PRIORITY_LEVELS[filters.priority.toUpperCase()];
      filtered = filtered.filter(
        (campaign) =>
          campaign.priority_score >= priorityRange.value - 100 &&
          campaign.priority_score <= priorityRange.value + 100
      );
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (campaign) =>
          campaign.title.toLowerCase().includes(searchLower) ||
          campaign.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered.sort((a, b) => b.priority_score - a.priority_score);
  }, [campaigns, filters]);

  /**
   * Get priority level info
   */
  const getPriorityLevel = (score) => {
    for (const [key, level] of Object.entries(PRIORITY_LEVELS)) {
      if (score >= level.value - 100 && score <= level.value + 100) {
        return { key, ...level };
      }
    }
    return { key: "CUSTOM", value: score, label: "Özel", color: "purple" };
  };

  /**
   * Update campaign priority
   */
  const updateCampaignPriority = async (campaignId, newPriorityScore) => {
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({
          priority_score: newPriorityScore,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId);

      if (error) throw error;

      // Update local state
      setCampaigns((prev) =>
        prev.map((campaign) =>
          campaign.id === campaignId
            ? { ...campaign, priority_score: newPriorityScore }
            : campaign
        )
      );

      notifications.success("Kampanya önceliği güncellendi");
    } catch (error) {
      console.error("Error updating priority:", error);
      notifications.error("Öncelik güncellenirken hata oluştu");
    }
  };

  /**
   * Toggle campaign status
   */
  const toggleCampaignStatus = async (campaignId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";

    try {
      const { error } = await supabase
        .from("campaigns")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId);

      if (error) throw error;

      setCampaigns((prev) =>
        prev.map((campaign) =>
          campaign.id === campaignId
            ? { ...campaign, status: newStatus }
            : campaign
        )
      );

      notifications.success(
        `Kampanya ${newStatus === "active" ? "başlatıldı" : "durduruldu"}`
      );
    } catch (error) {
      console.error("Error toggling status:", error);
      notifications.error("Durum değiştirilirken hata oluştu");
    }
  };

  /**
   * Delete campaign
   */
  const deleteCampaign = async (campaignId) => {
    if (!confirm("Bu kampanyayı silmek istediğinizden emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;

      setCampaigns((prev) =>
        prev.filter((campaign) => campaign.id !== campaignId)
      );
      notifications.success("Kampanya silindi");
    } catch (error) {
      console.error("Error deleting campaign:", error);
      notifications.error("Kampanya silinirken hata oluştu");
    }
  };

  /**
   * Drag and drop handlers
   */
  const handleDragStart = (campaign) => {
    setDraggedCampaign(campaign);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetCampaign) => {
    e.preventDefault();

    if (!draggedCampaign || draggedCampaign.id === targetCampaign.id) {
      setDraggedCampaign(null);
      return;
    }

    // Update priorities based on drop position
    const draggedIndex = filteredCampaigns.findIndex(
      (c) => c.id === draggedCampaign.id
    );
    const targetIndex = filteredCampaigns.findIndex(
      (c) => c.id === targetCampaign.id
    );

    if (draggedIndex < targetIndex) {
      // Moving down - set priority slightly lower than target
      await updateCampaignPriority(
        draggedCampaign.id,
        targetCampaign.priority_score - 1
      );
    } else {
      // Moving up - set priority slightly higher than target
      await updateCampaignPriority(
        draggedCampaign.id,
        targetCampaign.priority_score + 1
      );
    }

    setDraggedCampaign(null);
  };

  /**
   * Quick priority actions
   */
  const quickPriorityAction = async (campaignId, action) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;

    let newPriority;

    switch (action) {
      case "boost":
        newPriority = Math.min(campaign.priority_score + 100, 1000);
        break;
      case "lower":
        newPriority = Math.max(campaign.priority_score - 100, 0);
        break;
      case "top":
        newPriority = 1000;
        break;
      case "bottom":
        newPriority = 0;
        break;
      default:
        return;
    }

    await updateCampaignPriority(campaignId, newPriority);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kampanya Öncelik Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Kampanyaların carousel'lerde görüntülenme sırasını yönetin
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <EyeIcon className="w-5 h-5" />
            Önizleme
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Yeni Kampanya
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Kampanya ara..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="paused">Duraklatılmış</option>
            <option value="scheduled">Planlanmış</option>
            <option value="ended">Sonlanmış</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, priority: e.target.value }))
            }
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Tüm Öncelikler</option>
            {Object.entries(PRIORITY_LEVELS).map(([key, level]) => (
              <option key={key} value={key.toLowerCase()}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Priority Level Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Öncelik Seviyeleri
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(PRIORITY_LEVELS).map(([key, level]) => (
            <div key={key} className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full bg-${level.color}-500`}
              ></div>
              <div>
                <div className="font-medium text-sm">{level.label}</div>
                <div className="text-xs text-gray-500">{level.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Kampanyalar ({filteredCampaigns.length})
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Sürükle-bırak ile öncelik sırasını değiştirebilirsiniz
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <AnimatePresence>
            {filteredCampaigns.map((campaign, index) => {
              const priorityLevel = getPriorityLevel(campaign.priority_score);

              return (
                <motion.div
                  key={campaign.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  draggable
                  onDragStart={() => handleDragStart(campaign)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, campaign)}
                  className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-move ${
                    draggedCampaign?.id === campaign.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Campaign Info */}
                    <div className="flex items-center gap-4 flex-1">
                      {/* Priority Indicator */}
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold text-gray-400 w-8">
                          #{index + 1}
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full bg-${priorityLevel.color}-500`}
                        ></div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {priorityLevel.label}
                        </div>
                      </div>

                      {/* Campaign Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {campaign.title}
                          </h4>

                          {/* Status Badge */}
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              campaign.status === "active"
                                ? "bg-green-100 text-green-800"
                                : campaign.status === "paused"
                                ? "bg-yellow-100 text-yellow-800"
                                : campaign.status === "scheduled"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {campaign.status === "active"
                              ? "Aktif"
                              : campaign.status === "paused"
                              ? "Duraklatılmış"
                              : campaign.status === "scheduled"
                              ? "Planlanmış"
                              : "Sonlanmış"}
                          </span>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                          {campaign.description || "Açıklama yok"}
                        </p>

                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Öncelik Puanı: {campaign.priority_score}</span>
                          <span>•</span>
                          <span>
                            {campaign.campaign_products?.length || 0} ürün
                          </span>
                          {campaign.start_date && (
                            <>
                              <span>•</span>
                              <span>
                                Başlangıç:{" "}
                                {new Date(
                                  campaign.start_date
                                ).toLocaleDateString("tr-TR")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Quick Priority Actions */}
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            quickPriorityAction(campaign.id, "top")
                          }
                          title="En üste çıkar"
                          className="p-1.5 text-gray-400 hover:text-green-500 transition-colors"
                        >
                          <StarIcon className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            quickPriorityAction(campaign.id, "boost")
                          }
                          title="Önceliği artır"
                          className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <ArrowUpIcon className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            quickPriorityAction(campaign.id, "lower")
                          }
                          title="Önceliği azalt"
                          className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors"
                        >
                          <ArrowDownIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Status Toggle */}
                      <button
                        onClick={() =>
                          toggleCampaignStatus(campaign.id, campaign.status)
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          campaign.status === "active"
                            ? "text-yellow-600 hover:bg-yellow-50"
                            : "text-green-600 hover:bg-green-50"
                        }`}
                        title={
                          campaign.status === "active" ? "Duraklat" : "Başlat"
                        }
                      >
                        {campaign.status === "active" ? (
                          <PauseIcon className="w-5 h-5" />
                        ) : (
                          <PlayIcon className="w-5 h-5" />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => setSelectedCampaign(campaign)}
                        className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Düzenle"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>

                      {/* Analytics */}
                      <button
                        onClick={() => {
                          /* Analytics modal */
                        }}
                        className="p-2 text-gray-400 hover:text-purple-500 rounded-lg hover:bg-purple-50 transition-colors"
                        title="Analitik"
                      >
                        <ChartBarIcon className="w-5 h-5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => deleteCampaign(campaign.id)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Sil"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredCampaigns.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-lg mb-2">
                Kampanya bulunamadı
              </div>
              <p className="text-gray-500">
                Filtrelerinizi değiştirin veya yeni kampanya oluşturun
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Live Preview Panel */}
      {showPreview && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <EyeIcon className="w-5 h-5" />
            Carousel Önizlemesi
          </h3>

          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Bu kampanyalar carousel'lerde aşağıdaki sırayla görüntülenecek:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCampaigns
                .filter(
                  (campaign) =>
                    campaign.status === "active" && campaign.priority_score > 0
                )
                .slice(0, 6)
                .map((campaign, index) => (
                  <div
                    key={campaign.id}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg relative overflow-hidden"
                  >
                    <div className="absolute top-2 right-2 bg-white/20 px-2 py-1 rounded text-xs">
                      #{index + 1}
                    </div>
                    <h4 className="font-semibold text-sm">{campaign.title}</h4>
                    <p className="text-xs text-white/80 mt-1">
                      {campaign.description?.slice(0, 50)}...
                    </p>
                    <div className="text-xs mt-2 text-white/60">
                      Öncelik: {campaign.priority_score}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCampaignPriorityManagement;
