import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClockIcon as ClockIconSolid,
  TruckIcon as TruckIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon,
  EyeIcon as EyeIconSolid,
  CogIcon,
  MapPinIcon as MapPinIconSolid,
  UserIcon as UserIconSolid,
  CurrencyDollarIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";

import NavBar from "../components/NavBar";
import { Modal, ModalButton, FormModal } from "../components/ui";
import Spinner from "../components/Spinner";

const orderStatusConfig = {
  pending: {
    icon: ClockIcon,
    color:
      "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200",
    text: "Beklemede",
  },
  processing: {
    icon: ClockIcon,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200",
    text: "Hazırlanıyor",
  },
  shipped: {
    icon: TruckIcon,
    color:
      "text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200",
    text: "Kargoya Verildi",
  },
  delivered: {
    icon: CheckCircleIcon,
    color: "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200",
    text: "Teslim Edildi",
  },
  cancelled: {
    icon: ExclamationTriangleIcon,
    color: "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200",
    text: "İptal Edildi",
  },
};

const paymentStatusConfig = {
  pending: { text: "Beklemede", color: "text-yellow-600" },
  completed: { text: "Tamamlandı", color: "text-green-600" },
  failed: { text: "Başarısız", color: "text-red-600" },
  refunded: { text: "İade Edildi", color: "text-gray-600" },
};

export default function SellerOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({
    tracking_number: "",
    shipping_company: "",
    shipping_service: "",
    status: "shipped",
  });
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch seller orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ["seller-orders", user?.id],
    queryFn: async () => {
      if (!user?.seller_id) return [];

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items!inner(
            id,
            quantity,
            price,
            seller_id,
            product:products(name, images),
            variant:product_variants(title)
          ),
          order_tracking(
            tracking_number,
            shipping_company,
            status,
            estimated_delivery
          ),
          user:users(
            id,
            full_name,
            email,
            phone
          )
        `
        )
        .eq("order_items.seller_id", user.seller_id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user?.seller_id,
  });

  // Update order tracking
  const updateTracking = useMutation({
    mutationFn: async ({ orderId, trackingData }) => {
      // First create or update order tracking
      const { data: tracking, error: trackingError } = await supabase
        .from("order_tracking")
        .upsert({
          order_id: orderId,
          ...trackingData,
          status_updates: [
            {
              status: trackingData.status,
              timestamp: new Date().toISOString(),
              description: `Sipariş ${orderStatusConfig[
                trackingData.status
              ]?.text.toLowerCase()}`,
              location: trackingData.shipping_company,
            },
          ],
        })
        .select()
        .single();

      if (trackingError) throw new Error(trackingError.message);

      // Update public tracking
      const { error: publicError } = await supabase
        .from("public_order_tracking")
        .upsert({
          order_id: orderId,
          current_status: trackingData.status,
          status_description: `Sipariş ${orderStatusConfig[
            trackingData.status
          ]?.text.toLowerCase()}`,
          estimated_delivery: trackingData.estimated_delivery,
          public_status_history: [
            {
              status: trackingData.status,
              timestamp: new Date().toISOString(),
              description: `Sipariş ${orderStatusConfig[
                trackingData.status
              ]?.text.toLowerCase()}`,
            },
          ],
        });

      if (publicError) throw new Error(publicError.message);

      // Update order fulfillment status
      const { error: orderError } = await supabase
        .from("orders")
        .update({ fulfillment_status: trackingData.status })
        .eq("id", orderId);

      if (orderError) throw new Error(orderError.message);

      return tracking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["seller-orders"]);
      toast.success("Sipariş durumu güncellendi");
      setShowTrackingModal(false);
      setTrackingInfo({
        tracking_number: "",
        shipping_company: "",
        shipping_service: "",
        status: "shipped",
      });
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  // Filter orders
  const filteredOrders =
    orders?.filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.user?.full_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterStatus === "all") return true;
      return order.fulfillment_status === filterStatus;
    }) || [];

  const handleUpdateTracking = () => {
    if (!selectedOrder) return;

    updateTracking.mutate({
      orderId: selectedOrder.id,
      trackingData: trackingInfo,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <NavBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10" />
            <div className="relative p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <TruckIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Sipariş Yönetimi
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Siparişlerinizi akıllı takip sistemi ile yönetin
                  </p>
                </div>
              </div>

              {/* Order Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {orders?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Toplam Sipariş
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {orders?.filter((o) => o.fulfillment_status === "pending")
                      .length || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Bekleyen
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {orders?.filter(
                      (o) => o.fulfillment_status === "processing"
                    ).length || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Hazırlanıyor
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {orders?.filter((o) => o.fulfillment_status === "delivered")
                      .length || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Teslim Edildi
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Sipariş numarası veya müşteri ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-gray-100/50 dark:bg-gray-700/50 rounded-xl p-1 backdrop-blur-sm min-w-max">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  filterStatus === "all"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setFilterStatus("pending")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  filterStatus === "pending"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Bekleyen
              </button>
              <button
                onClick={() => setFilterStatus("processing")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  filterStatus === "processing"
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Hazırlanıyor
              </button>
              <button
                onClick={() => setFilterStatus("shipped")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  filterStatus === "shipped"
                    ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Kargoda
              </button>
              <button
                onClick={() => setFilterStatus("delivered")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  filterStatus === "delivered"
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Teslim Edildi
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const statusInfo =
                orderStatusConfig[order.fulfillment_status] ||
                orderStatusConfig.pending;
              const StatusIcon = statusInfo.icon;
              const paymentInfo =
                paymentStatusConfig[order.payment_status] ||
                paymentStatusConfig.pending;

              // Calculate seller's items total
              const sellerItems = order.order_items.filter(
                (item) => item.seller_id === user.seller_id
              );
              const sellerTotal = sellerItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
              );

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                      <div className="flex items-center gap-4 mb-4 lg:mb-0">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            #{order.order_number}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(order.created_at).toLocaleDateString(
                              "tr-TR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                          >
                            <StatusIcon className="h-4 w-4 mr-1" />
                            {statusInfo.text}
                          </span>
                          <span
                            className={`text-xs font-medium ${paymentInfo.color}`}
                          >
                            Ödeme: {paymentInfo.text}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderModal(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Detay
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setTrackingInfo({
                              tracking_number:
                                order.order_tracking?.[0]?.tracking_number ||
                                "",
                              shipping_company:
                                order.order_tracking?.[0]?.shipping_company ||
                                "",
                              shipping_service:
                                order.order_tracking?.[0]?.shipping_service ||
                                "",
                              status: order.fulfillment_status || "shipped",
                            });
                            setShowTrackingModal(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-md"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Takip Güncelle
                        </button>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-900 dark:text-white">
                            {order.user?.full_name || "Müşteri"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <EnvelopeIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {order.user?.email}
                          </span>
                        </div>
                        {order.user?.phone && (
                          <div className="flex items-center gap-1">
                            <PhoneIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {order.user.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3">
                      {sellerItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                        >
                          <img
                            src={
                              item.product.images?.[0] ||
                              "/placeholder-product.jpg"
                            }
                            alt={item.product.name}
                            className="h-12 w-12 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.product.name}
                            </h4>
                            {item.variant?.title && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {item.variant.title}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Adet: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              ₺{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Summary */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Bu satıcıdan toplam ({sellerItems.length} ürün)
                        </span>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          ₺{sellerTotal.toFixed(2)}
                        </span>
                      </div>
                      {order.order_tracking?.[0]?.tracking_number && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <TruckIcon className="h-4 w-4 inline mr-1" />
                          Takip No:{" "}
                          <span className="font-mono">
                            {order.order_tracking[0].tracking_number}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {filterStatus === "all"
                  ? "Henüz sipariş yok"
                  : "Bu durumda sipariş bulunamadı"}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {filterStatus === "all"
                  ? "İlk siparişiniz geldiğinde burada görünecek."
                  : "Farklı bir filtre seçmeyi deneyin."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <Modal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)}>
          <Modal.Header>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Sipariş Detayı: #{selectedOrder.order_number}
            </h3>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="border-b border-gray-200 dark:border-gray-600 pb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Müşteri Bilgileri
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Ad Soyad:
                    </span>
                    <p className="text-gray-900 dark:text-white">
                      {selectedOrder.user?.full_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      E-posta:
                    </span>
                    <p className="text-gray-900 dark:text-white">
                      {selectedOrder.user?.email}
                    </p>
                  </div>
                  {selectedOrder.user?.phone && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Telefon:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {selectedOrder.user.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Info */}
              <div className="border-b border-gray-200 dark:border-gray-600 pb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Sipariş Bilgileri
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Sipariş Tarihi:
                    </span>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(selectedOrder.created_at).toLocaleDateString(
                        "tr-TR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Ödeme Durumu:
                    </span>
                    <p
                      className={`font-medium ${
                        paymentStatusConfig[selectedOrder.payment_status]?.color
                      }`}
                    >
                      {paymentStatusConfig[selectedOrder.payment_status]?.text}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shipping_address && (
                <div className="border-b border-gray-200 dark:border-gray-600 pb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Teslimat Adresi
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {typeof selectedOrder.shipping_address === "string"
                          ? selectedOrder.shipping_address
                          : `${selectedOrder.shipping_address.address}, ${selectedOrder.shipping_address.city}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Ürünler
                </h4>
                <div className="space-y-2">
                  {selectedOrder.order_items
                    .filter((item) => item.seller_id === user.seller_id)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 border border-gray-200 dark:border-gray-600 rounded"
                      >
                        <img
                          src={
                            item.product.images?.[0] ||
                            "/placeholder-product.jpg"
                          }
                          alt={item.product.name}
                          className="h-10 w-10 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.product.name}
                          </p>
                          {item.variant?.title && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {item.variant.title}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-gray-900 dark:text-white">
                            {item.quantity}x ₺{item.price.toFixed(2)}
                          </p>
                          <p className="font-medium">
                            ₺{(item.quantity * item.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <ModalButton onClick={() => setShowOrderModal(false)}>
              Kapat
            </ModalButton>
          </Modal.Footer>
        </Modal>
      )}

      {/* Tracking Update Modal */}
      {showTrackingModal && selectedOrder && (
        <Modal
          isOpen={showTrackingModal}
          onClose={() => setShowTrackingModal(false)}
        >
          <Modal.Header>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Takip Bilgilerini Güncelle: #{selectedOrder.order_number}
            </h3>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sipariş Durumu
                </label>
                <select
                  value={trackingInfo.status}
                  onChange={(e) =>
                    setTrackingInfo((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               dark:bg-gray-700 dark:text-white"
                >
                  <option value="processing">Hazırlanıyor</option>
                  <option value="shipped">Kargoya Verildi</option>
                  <option value="in_transit">Yolda</option>
                  <option value="out_for_delivery">Dağıtımda</option>
                  <option value="delivered">Teslim Edildi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Takip Numarası
                </label>
                <input
                  type="text"
                  value={trackingInfo.tracking_number}
                  onChange={(e) =>
                    setTrackingInfo((prev) => ({
                      ...prev,
                      tracking_number: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               dark:bg-gray-700 dark:text-white"
                  placeholder="Kargo takip numarası"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kargo Şirketi
                </label>
                <select
                  value={trackingInfo.shipping_company}
                  onChange={(e) =>
                    setTrackingInfo((prev) => ({
                      ...prev,
                      shipping_company: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Kargo şirketi seçin</option>
                  <option value="Yurtiçi Kargo">Yurtiçi Kargo</option>
                  <option value="MNG Kargo">MNG Kargo</option>
                  <option value="Aras Kargo">Aras Kargo</option>
                  <option value="PTT Kargo">PTT Kargo</option>
                  <option value="UPS">UPS</option>
                  <option value="DHL">DHL</option>
                  <option value="HepsiJet">HepsiJet</option>
                  <option value="Sürat Kargo">Sürat Kargo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kargo Servisi
                </label>
                <input
                  type="text"
                  value={trackingInfo.shipping_service}
                  onChange={(e) =>
                    setTrackingInfo((prev) => ({
                      ...prev,
                      shipping_service: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               dark:bg-gray-700 dark:text-white"
                  placeholder="Örn: Standart, Express, Next Day"
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <ModalButton
              onClick={handleUpdateTracking}
              isLoading={updateTracking.isLoading}
            >
              {updateTracking.isLoading ? "Güncelleniyor..." : "Güncelle"}
            </ModalButton>
            <ModalButton onClick={() => setShowTrackingModal(false)}>
              İptal
            </ModalButton>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
