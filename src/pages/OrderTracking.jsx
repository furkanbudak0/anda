import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { formatPrice, formatDate } from "../utils/formatters";
import {
  TruckIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function OrderTracking() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get("seller");

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order-tracking", orderId, sellerId],
    queryFn: async () => {
      let query = supabase
        .from("order_items")
        .select(
          `
          *,
          order:orders(
            id,
            order_number,
            total_amount,
            status,
            created_at,
            shipping_address,
            billing_address
          ),
          product:products(
            name,
            image_url,
            uuid,
            seller:sellers(
              id,
              business_name,
              business_slug,
              logo_url
            )
          )
        `
        )
        .eq("order_id", orderId);

      if (sellerId) {
        query = query.eq("seller_id", sellerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Kargo Takip Bilgisi Bulunamadı
            </h1>
            <p className="text-gray-600 mb-6">
              Aradığınız kargo takip bilgisi bulunamadı.
            </p>
            <Link
              to="/orders"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Siparişlerime Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order || order.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <TruckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Kargo Takip Bilgisi Yok
            </h1>
            <p className="text-gray-600 mb-6">
              Bu sipariş için henüz kargo takip bilgisi girilmemiş.
            </p>
            <Link
              to="/orders"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Siparişlerime Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered":
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case "shipped":
      case "in_transit":
      case "out_for_delivery":
        return <TruckIcon className="w-6 h-6 text-blue-500" />;
      case "processing":
        return <ClockIcon className="w-6 h-6 text-yellow-500" />;
      default:
        return <ClockIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
      case "in_transit":
      case "out_for_delivery":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: "Sipariş Alındı",
      processing: "Hazırlanıyor",
      shipped: "Kargoya Verildi",
      in_transit: "Yolda",
      out_for_delivery: "Dağıtımda",
      delivered: "Teslim Edildi",
      failed: "Teslim Edilemedi",
      returned: "İade Edildi",
    };
    return statusTexts[status] || status;
  };

  // Satıcıya göre grupla
  const groupBySeller = () => {
    const groups = {};
    order.forEach((item) => {
      const sellerId = item.product?.seller?.id;
      if (!groups[sellerId]) {
        groups[sellerId] = {
          seller: item.product?.seller,
          items: [],
        };
      }
      groups[sellerId].items.push(item);
    });
    return Object.values(groups);
  };

  const sellerGroups = groupBySeller();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kargo Takibi</h1>
              <p className="text-gray-600 mt-2">
                Sipariş #{order[0]?.order?.order_number || orderId?.slice(0, 8)}
              </p>
            </div>
            <Link
              to="/orders"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              ← Siparişlerime Dön
            </Link>
          </div>
        </div>

        {/* Kargo Takip Bilgileri */}
        <div className="space-y-6">
          {sellerGroups.map((group, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              {/* Satıcı Başlığı */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                {group.seller?.logo_url && (
                  <img
                    src={group.seller.logo_url}
                    alt={group.seller.business_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {group.seller?.business_name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {group.items.length} ürün
                  </p>
                </div>
              </div>

              {/* Ürünler */}
              <div className="space-y-4">
                {group.items.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            item.product?.image_url ||
                            "/placeholder-product.jpg"
                          }
                          alt={item.product?.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {item.product?.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Adet: {item.quantity} • {formatPrice(item.total)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {getStatusIcon(item.status)}
                          {getStatusText(item.status)}
                        </span>
                      </div>
                    </div>

                    {/* Kargo Bilgileri */}
                    {item.tracking_number && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">
                              Kargo Bilgileri
                            </h4>
                            <div className="space-y-2 text-sm">
                              <p>
                                <span className="font-medium">Takip No:</span>{" "}
                                <span className="font-mono">
                                  {item.tracking_number}
                                </span>
                              </p>
                              {item.shipping_company && (
                                <p>
                                  <span className="font-medium">Kargo:</span>{" "}
                                  {item.shipping_company}
                                </p>
                              )}
                              {item.current_location && (
                                <p>
                                  <span className="font-medium">Konum:</span>{" "}
                                  {item.current_location}
                                </p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">
                              Tahmini Teslimat
                            </h4>
                            <div className="space-y-2 text-sm">
                              {item.estimated_delivery && (
                                <p className="flex items-center gap-2">
                                  <CalendarIcon className="w-4 h-4" />
                                  {new Date(
                                    item.estimated_delivery
                                  ).toLocaleDateString("tr-TR")}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Not:</span>{" "}
                                  {item.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Kargo Takip Detayları */}
                    {item.shipping_tracking_details &&
                      item.shipping_tracking_details.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-3">
                            Kargo Takip Geçmişi
                          </h4>
                          <div className="space-y-3">
                            {item.shipping_tracking_details.map(
                              (detail, detailIndex) => (
                                <div
                                  key={detailIndex}
                                  className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200"
                                >
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                      {detail.status}
                                    </p>
                                    {detail.location && (
                                      <p className="text-sm text-gray-600">
                                        <MapPinIcon className="w-4 h-4 inline mr-1" />
                                        {detail.location}
                                      </p>
                                    )}
                                    {detail.description && (
                                      <p className="text-sm text-gray-500 mt-1">
                                        {detail.description}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                      {new Date(
                                        detail.created_at
                                      ).toLocaleString("tr-TR")}
                                    </p>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Teslimat Adresi */}
        {order[0]?.order?.shipping_address && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPinIcon className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Teslimat Adresi
              </h2>
            </div>
            <div className="text-gray-700">
              <p>{order[0].order.shipping_address}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
