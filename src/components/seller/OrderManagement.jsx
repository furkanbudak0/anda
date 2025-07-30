import { useState } from "react";
import {
  TruckIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  useSellerOrders,
  useUpdateOrderTracking,
  useShippingCompanies,
  useUpdateOrderStatus,
} from "../../hooks/useOrderTracking";
import { formatPrice } from "../../utils/formatters";
import toast from "react-hot-toast";
import PropTypes from "prop-types";

const STATUS_OPTIONS = [
  { value: "pending", label: "Sipariş Alındı", color: "yellow" },
  { value: "processing", label: "Hazırlanıyor", color: "blue" },
  { value: "shipped", label: "Kargoya Verildi", color: "orange" },
  { value: "in_transit", label: "Yolda", color: "indigo" },
  { value: "out_for_delivery", label: "Dağıtımda", color: "green" },
  { value: "delivered", label: "Teslim Edildi", color: "green" },
  { value: "failed", label: "Teslim Edilemedi", color: "red" },
  { value: "returned", label: "İade Edildi", color: "gray" },
];

export default function OrderManagement({ sellerId }) {
  const { data: orderItems, isLoading, error } = useSellerOrders(sellerId);
  const { data: shippingCompanies } = useShippingCompanies();
  const updateOrderTracking = useUpdateOrderTracking();
  const updateOrderStatus = useUpdateOrderStatus();

  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingForm, setTrackingForm] = useState({
    tracking_number: "",
    shipping_company: "",
    shipping_service: "",
    status: "shipped",
    current_location: "",
    estimated_delivery: "",
    notes: "",
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Siparişler Yüklenemedi
          </h3>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  const handleUpdateTracking = async (orderItemId) => {
    try {
      await updateOrderTracking.mutateAsync({
        orderTrackingId: orderItemId,
        trackingData: trackingForm,
      });
      setShowTrackingModal(false);
      setTrackingForm({
        tracking_number: "",
        shipping_company: "",
        shipping_service: "",
        status: "shipped",
        current_location: "",
        estimated_delivery: "",
        notes: "",
      });
    } catch (error) {
      toast.error("Kargo bilgileri güncellenirken hata oluştu");
    }
  };

  const handleUpdateOrderStatus = async (orderItemId, status) => {
    try {
      await updateOrderStatus.mutateAsync({
        orderItemId,
        status,
      });
    } catch (error) {
      toast.error("Sipariş durumu güncellenirken hata oluştu");
    }
  };

  // Siparişleri grupla (aynı siparişteki ürünler)
  const groupOrderItemsByOrder = () => {
    const groups = {};
    orderItems?.forEach((item) => {
      const orderId = item.order?.id;
      if (!groups[orderId]) {
        groups[orderId] = {
          order: item.order,
          items: [],
          total: 0,
        };
      }
      groups[orderId].items.push(item);
      groups[orderId].total += item.total;
    });
    return Object.values(groups);
  };

  const orderGroups = groupOrderItemsByOrder();

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Sipariş Yönetimi</h2>
        <p className="text-gray-600 mt-2">
          Toplam {orderItems?.length || 0} ürün siparişi
        </p>
      </div>

      {/* Sipariş Listesi */}
      <div className="space-y-6">
        {orderGroups?.map((group) => (
          <div
            key={group.order?.id}
            className="bg-gray-50 rounded-xl border border-gray-200 p-6"
          >
            {/* Sipariş Başlığı */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Sipariş #
                  {group.order?.order_number || group.order?.id?.slice(0, 8)}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(group.order?.created_at).toLocaleDateString(
                      "tr-TR"
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-4 h-4" />
                    {group.order?.user?.full_name || group.order?.user?.email}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {formatPrice(group.total)}
                </p>
                <p className="text-sm text-gray-600">
                  {group.items.length} ürün
                </p>
              </div>
            </div>

            {/* Ürünler */}
            <div className="space-y-4">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          item.product?.image_url || "/placeholder-product.jpg"
                        }
                        alt={item.product?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {item.product?.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Adet: {item.quantity} • Birim:{" "}
                          {formatPrice(item.price)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Toplam: {formatPrice(item.total)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Sipariş Durumu */}
                      <select
                        value={item.status || "pending"}
                        onChange={(e) =>
                          handleUpdateOrderStatus(item.id, e.target.value)
                        }
                        className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {/* Kargo Takip Butonu */}
                      <button
                        onClick={() => {
                          setSelectedOrderItem(item);
                          setTrackingForm({
                            tracking_number: item.tracking_number || "",
                            shipping_company: item.shipping_company || "",
                            shipping_service: item.shipping_service || "",
                            status: item.status || "shipped",
                            current_location: item.current_location || "",
                            estimated_delivery: item.estimated_delivery || "",
                            notes: item.notes || "",
                          });
                          setShowTrackingModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        <TruckIcon className="w-4 h-4" />
                        Kargo
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sipariş Notları */}
            {group.order?.notes && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h5 className="font-medium text-yellow-800 mb-2">
                  Müşteri Notu:
                </h5>
                <p className="text-yellow-700 text-sm">{group.order.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Kargo Takip Modal */}
      {showTrackingModal && selectedOrderItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Kargo Bilgileri
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Takip Numarası
                </label>
                <input
                  type="text"
                  value={trackingForm.tracking_number}
                  onChange={(e) =>
                    setTrackingForm({
                      ...trackingForm,
                      tracking_number: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kargo Şirketi
                </label>
                <select
                  value={trackingForm.shipping_company}
                  onChange={(e) =>
                    setTrackingForm({
                      ...trackingForm,
                      shipping_company: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seçiniz</option>
                  {shippingCompanies?.map((company) => (
                    <option key={company.id} value={company.name}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durum
                </label>
                <select
                  value={trackingForm.status}
                  onChange={(e) =>
                    setTrackingForm({ ...trackingForm, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notlar
                </label>
                <textarea
                  value={trackingForm.notes}
                  onChange={(e) =>
                    setTrackingForm({ ...trackingForm, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTrackingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={() => handleUpdateTracking(selectedOrderItem.id)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

OrderManagement.propTypes = {
  sellerId: PropTypes.string.isRequired,
};
