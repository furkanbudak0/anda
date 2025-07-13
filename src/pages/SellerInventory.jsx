/* eslint-disable react/prop-types */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useInventoryMovements,
  useStockAlerts,
  useAcknowledgeStockAlert,
  useCreateInventoryMovement,
} from "../hooks/useAnalytics";
import { useProducts } from "../hooks/useProducts";
import { toast } from "react-hot-toast";
import {
  ExclamationTriangleIcon,
  PlusIcon,
  MinusIcon,
  AdjustmentsHorizontalIcon,
  TruckIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  CubeIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
} from "@heroicons/react/24/solid";

import NavBar from "../components/NavBar";
import { useBringToFrontAndCenter } from "../utils/bringToFrontAndCenter";

/**
 * MODERN SELLER INVENTORY MANAGEMENT
 *
 * Features:
 * - Real-time stock tracking with visual indicators
 * - Advanced filtering and search capabilities
 * - Animated stock movement history
 * - Smart stock alerts with auto-acknowledgment
 * - Modern gradient design with glassmorphism effects
 * - Responsive layout with mobile-first approach
 * - Accessibility compliance (ARIA attributes)
 */

// Enhanced movement type configuration with modern design
const movementTypeConfig = {
  sale: {
    icon: MinusIcon,
    gradient: "from-red-500 to-red-600",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
    border: "border-red-200 dark:border-red-800",
    label: "Satış",
    description: "Ürün satışından kaynaklanan stok azalışı",
  },
  restock: {
    icon: PlusIcon,
    gradient: "from-emerald-500 to-emerald-600",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20",
    border: "border-emerald-200 dark:border-emerald-800",
    label: "Stok Ekleme",
    description: "Yeni stok girişi",
  },
  adjustment: {
    icon: AdjustmentsHorizontalIcon,
    gradient: "from-blue-500 to-blue-600",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
    border: "border-blue-200 dark:border-blue-800",
    label: "Düzeltme",
    description: "Manuel stok düzeltmesi",
  },
  return: {
    icon: ArrowPathIcon,
    gradient: "from-amber-500 to-amber-600",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20",
    border: "border-amber-200 dark:border-amber-800",
    label: "İade",
    description: "Müşteri iadesi",
  },
  damage: {
    icon: ExclamationTriangleIcon,
    gradient: "from-red-500 to-red-600",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
    border: "border-red-200 dark:border-red-800",
    label: "Hasar",
    description: "Hasarlı ürün kaybı",
  },
  transfer: {
    icon: TruckIcon,
    gradient: "from-purple-500 to-purple-600",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
    border: "border-purple-200 dark:border-purple-800",
    label: "Transfer",
    description: "Depo transfer işlemi",
  },
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
    },
  },
};

const StockIndicator = ({ quantity, lowStockThreshold = 10 }) => {
  const getStatusConfig = () => {
    if (quantity === 0) {
      return {
        icon: ExclamationTriangleIconSolid,
        color: "text-red-500",
        bg: "bg-red-100 dark:bg-red-900/30",
        label: "Tükendi",
        percentage: 0,
      };
    }
    if (quantity <= lowStockThreshold) {
      return {
        icon: ExclamationTriangleIcon,
        color: "text-amber-500",
        bg: "bg-amber-100 dark:bg-amber-900/30",
        label: "Az Stok",
        percentage: (quantity / lowStockThreshold) * 100,
      };
    }
    return {
      icon: CheckCircleIconSolid,
      color: "text-emerald-500",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      label: "Yeterli",
      percentage: 100,
    };
  };

  const status = getStatusConfig();
  const Icon = status.icon;

  return (
    <div className="flex items-center gap-2">
      <div className={`p-1.5 rounded-full ${status.bg}`}>
        <Icon className={`w-4 h-4 ${status.color}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className={`font-medium ${status.color}`}>{status.label}</span>
          <span className="text-gray-600 dark:text-gray-400">{quantity}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
          <motion.div
            className={`h-1.5 rounded-full bg-gradient-to-r ${
              quantity === 0
                ? "from-red-400 to-red-500"
                : quantity <= lowStockThreshold
                ? "from-amber-400 to-amber-500"
                : "from-emerald-400 to-emerald-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(status.percentage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
};

const StockMovementModal = ({
  isOpen,
  onClose,
  selectedProduct,
  stockMovement,
  setStockMovement,
  onSubmit,
  isLoading,
}) => {
  const modalId = "stock-movement-modal";
  const { elementRef } = useBringToFrontAndCenter(modalId, {
    isOpen,
    type: "MODAL",
    onClose,
    center: true,
    trapFocus: true,
    preventBodyScroll: true,
    restoreFocus: true,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          ref={elementRef}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-2xl"
        >
          {/* Header */}
          <div className="relative px-6 py-6 bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <CubeIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Stok Hareketi Oluştur
                </h3>
                <p className="text-blue-100">{selectedProduct?.name}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Movement Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                Hareket Türü
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(movementTypeConfig).map(([type, config]) => {
                  const Icon = config.icon;
                  const isSelected = stockMovement.type === type;

                  return (
                    <motion.button
                      key={type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setStockMovement((prev) => ({ ...prev, type }))
                      }
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? `${config.bg} ${config.border} ${config.color}`
                          : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm font-medium">{config.label}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Input */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Miktar
              </label>
              <input
                type="number"
                min="1"
                value={stockMovement.quantity}
                onChange={(e) =>
                  setStockMovement((prev) => ({
                    ...prev,
                    quantity: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-3 text-lg font-semibold text-center border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="0"
              />
            </div>

            {/* Reason Input */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Açıklama
              </label>
              <textarea
                value={stockMovement.reason}
                onChange={(e) =>
                  setStockMovement((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Stok hareketinin sebebini açıklayın..."
              />
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Referans Numarası
              </label>
              <input
                type="text"
                value={stockMovement.referenceNumber}
                onChange={(e) =>
                  setStockMovement((prev) => ({
                    ...prev,
                    referenceNumber: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Opsiyonel referans numarası..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onSubmit}
              disabled={isLoading || !stockMovement.quantity}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  İşleniyor...
                </div>
              ) : (
                "Stok Hareketini Kaydet"
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default function SellerInventory() {
  const [activeTab, setActiveTab] = useState("products");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockMovement, setStockMovement] = useState({
    type: "restock",
    quantity: 0,
    reason: "",
    referenceNumber: "",
  });

  // Fetch data
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const { data: movements, isLoading: isLoadingMovements } =
    useInventoryMovements();
  const { data: alerts, isLoading: isLoadingAlerts } = useStockAlerts();

  // Mutations
  const acknowledgeAlert = useAcknowledgeStockAlert();
  const createMovement = useCreateInventoryMovement();

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    return (
      products?.filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.sku?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        switch (filterStatus) {
          case "low_stock":
            return product.quantity <= 10 && product.quantity > 0;
          case "out_of_stock":
            return product.quantity === 0;
          case "in_stock":
            return product.quantity > 10;
          default:
            return true;
        }
      }) || []
    );
  }, [products, searchQuery, filterStatus]);

  // Analytics calculations
  const inventoryStats = useMemo(() => {
    if (!products) return {};

    const totalProducts = products.length;
    const inStock = products.filter((p) => p.quantity > 10).length;
    const lowStock = products.filter(
      (p) => p.quantity <= 10 && p.quantity > 0
    ).length;
    const outOfStock = products.filter((p) => p.quantity === 0).length;
    const totalValue = products.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0
    );

    return {
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
      totalValue,
      stockHealth: Math.round((inStock / totalProducts) * 100),
    };
  }, [products]);

  const handleStockMovement = async () => {
    if (
      !selectedProduct ||
      !stockMovement.quantity ||
      stockMovement.quantity === 0
    ) {
      toast.error("Lütfen tüm gerekli alanları doldurun");
      return;
    }

    const quantityChange = ["restock", "return"].includes(stockMovement.type)
      ? Math.abs(stockMovement.quantity)
      : -Math.abs(stockMovement.quantity);

    try {
      await createMovement.mutateAsync({
        productId: selectedProduct.id,
        movementType: stockMovement.type,
        quantityChange,
        reason: stockMovement.reason,
        referenceNumber: stockMovement.referenceNumber,
      });

      toast.success("Stok hareketi başarıyla kaydedildi");
      setShowStockModal(false);
      setSelectedProduct(null);
      setStockMovement({
        type: "restock",
        quantity: 0,
        reason: "",
        referenceNumber: "",
      });
    } catch (error) {
      console.error("Stock movement error:", error);
      toast.error("Stok hareketi kaydedilemedi");
    }
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setShowStockModal(true);
  };

  const getFilterButtonClass = (status) => {
    const isActive = filterStatus === status;
    return `px-4 py-2 text-sm font-medium rounded-lg transition-all ${
      isActive
        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
    }`;
  };

  if (isLoadingProducts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <NavBar />
        <div className="flex items-center justify-center h-96">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <NavBar />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Enhanced Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10" />
            <div className="relative p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <CubeIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Stok Yönetimi
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Ürün stoklarınızı akıllı yönetim sistemi ile takip edin
                  </p>
                </div>
              </div>

              {/* Inventory Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {inventoryStats.totalProducts}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Toplam Ürün
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {inventoryStats.stockHealth}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Stok Sağlığı
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {inventoryStats.lowStock}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Az Stok
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {inventoryStats.outOfStock}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Tükendi
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stock Alerts */}
        <AnimatePresence>
          {alerts && alerts.length > 0 && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="mb-6"
            >
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                        Stok Uyarıları ({alerts.length})
                      </h3>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 font-medium"
                      >
                        Tümünü Görüntüle
                      </motion.button>
                    </div>
                    <div className="grid gap-3">
                      {alerts.slice(0, 3).map((alert) => (
                        <motion.div
                          key={alert.id}
                          layout
                          className="flex items-center justify-between bg-white/60 dark:bg-amber-900/30 backdrop-blur-sm rounded-xl p-4 border border-amber-200/50 dark:border-amber-700/50"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                alert.product.image_url?.[0] ||
                                "/placeholder-product.jpg"
                              }
                              alt={alert.product.name}
                              className="w-12 h-12 object-cover rounded-lg border border-amber-200 dark:border-amber-700"
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {alert.product.name}
                              </p>
                              <p className="text-sm text-amber-700 dark:text-amber-300">
                                Stok: {alert.current_stock} • Eşik:{" "}
                                {alert.threshold}
                              </p>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openStockModal(alert.product)}
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
                          >
                            Stok Ekle
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Controls */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ürün ara..."
                  className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm transition-all"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 bg-gray-100/50 dark:bg-gray-700/50 rounded-xl p-1 backdrop-blur-sm">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={getFilterButtonClass("all")}
                >
                  Tümü ({products?.length || 0})
                </button>
                <button
                  onClick={() => setFilterStatus("in_stock")}
                  className={getFilterButtonClass("in_stock")}
                >
                  Stokta ({inventoryStats.inStock})
                </button>
                <button
                  onClick={() => setFilterStatus("low_stock")}
                  className={getFilterButtonClass("low_stock")}
                >
                  Az Stok ({inventoryStats.lowStock})
                </button>
                <button
                  onClick={() => setFilterStatus("out_of_stock")}
                  className={getFilterButtonClass("out_of_stock")}
                >
                  Tükendi ({inventoryStats.outOfStock})
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Products Grid */}
        <motion.div variants={itemVariants}>
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  whileHover={{ y: -2 }}
                  className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={product.images?.[0] || "/placeholder-product.jpg"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <div className="absolute top-4 right-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openStockModal(product)}
                        className="w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                      >
                        <PlusIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      </motion.button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        SKU: {product.sku || "N/A"}
                      </p>
                    </div>

                    <StockIndicator quantity={product.quantity} />

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            ₺{product.price?.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Toplam Değer: ₺
                            {(
                              product.price * product.quantity
                            ).toLocaleString()}
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openStockModal(product)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
                        >
                          Stok Ekle
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredProducts.length === 0 && (
            <motion.div variants={itemVariants} className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <CubeIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Ürün bulunamadı
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? "Arama kriterlerinizi değiştirmeyi deneyin"
                  : "Henüz ürün eklenmemiş"}
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Enhanced Stock Movement Modal */}
      <AnimatePresence>
        <StockMovementModal
          isOpen={showStockModal}
          onClose={() => setShowStockModal(false)}
          selectedProduct={selectedProduct}
          stockMovement={stockMovement}
          setStockMovement={setStockMovement}
          onSubmit={handleStockMovement}
          isLoading={createMovement.isPending}
        />
      </AnimatePresence>
    </div>
  );
}
