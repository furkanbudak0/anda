import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { formatPrice, formatDate } from "../utils/formatters";
import {
  TruckIcon,
  MapPinIcon,
  CreditCardIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

export default function OrderDetail() {
  const { orderId } = useParams();

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            *,
            product:products (
              name,
              image_url,
              uuid,
              price,
              discounted_price,
              seller:sellers(
                id,
                business_name,
                business_slug,
                logo_url
              )
            )
          ),
          address:addresses(*)
        `
        )
        .eq("id", orderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
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
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Sipariş Bulunamadı
            </h1>
            <p className="text-gray-600 mb-6">
              Aradığınız sipariş bulunamadı veya erişim izniniz yok.
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

  const getStatusColor = (status) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: "Beklemede",
      processing: "Hazırlanıyor",
      shipped: "Kargoda",
      delivered: "Teslim Edildi",
      cancelled: "İptal Edildi",
    };
    return statusTexts[status] || status;
  };

  // Satıcıya göre ürünleri grupla
  const groupItemsBySeller = () => {
    const groups = {};
    order.order_items?.forEach((item) => {
      const sellerId = item.product?.seller?.id;

      if (!groups[sellerId]) {
        groups[sellerId] = {
          seller: item.product?.seller,
          items: [],
          total: 0,
        };
      }

      groups[sellerId].items.push(item);
      groups[sellerId].total += item.total;
    });

    return Object.values(groups);
  };

  const sellerGroups = groupItemsBySeller();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Sipariş #{order.order_number || order.id.slice(0, 8)}
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {formatDate(order.created_at)}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  order.status
                )}`}
              >
                {getStatusText(order.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ana İçerik */}
          <div className="lg:col-span-2 space-y-6">
            {/* Satıcı Bazlı Ürün Grupları */}
            {sellerGroups.map((group, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                {/* Satıcı Başlığı */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    {group.seller?.logo_url && (
                      <img
                        src={group.seller.logo_url}
                        alt={group.seller.business_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {group.seller?.business_name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {group.items.length} ürün • Toplam:{" "}
                        {formatPrice(group.total)}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/seller/${group.seller?.business_slug}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Mağazayı Ziyaret Et
                  </Link>
                </div>

                {/* Ürünler */}
                <div className="space-y-4">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <img
                        src={
                          item.product?.image_url || "/placeholder-product.jpg"
                        }
                        alt={item.product?.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {item.product?.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Adet: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-500">
                          Birim Fiyat: {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {formatPrice(item.total)}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {getStatusText(item.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Kargo Takip Butonu */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Link
                    to={`/order/${orderId}/tracking?seller=${group.seller?.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <TruckIcon className="w-4 h-4" />
                    Kargo Takibi
                  </Link>
                </div>
              </div>
            ))}

            {/* Teslimat Adresi */}
            {order.address && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPinIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Teslimat Adresi
                  </h2>
                </div>
                <div className="text-gray-700">
                  <p className="font-medium">{order.address.full_name}</p>
                  <p>{order.address.address_line}</p>
                  <p>
                    {order.address.city}, {order.address.district}
                  </p>
                  {order.address.postal_code && (
                    <p>{order.address.postal_code}</p>
                  )}
                  {order.address.phone && <p>Tel: {order.address.phone}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sipariş Özeti */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Sipariş Özeti
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ara Toplam:</span>
                  <span className="font-medium">
                    {formatPrice(order.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kargo:</span>
                  <span className="font-medium">
                    {formatPrice(order.shipping_amount || 0)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-lg">Toplam:</span>
                    <span className="font-bold text-lg text-blue-600">
                      {formatPrice(
                        order.total_amount + (order.shipping_amount || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ödeme Bilgileri */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCardIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Ödeme Bilgileri
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Yöntem:</span>{" "}
                  {order.payment_method}
                </p>
                <p>
                  <span className="font-medium">Durum:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(
                      order.payment_status
                    )}`}
                  >
                    {getStatusText(order.payment_status)}
                  </span>
                </p>
              </div>
            </div>

            {/* Notlar */}
            {order.notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Sipariş Notları
                </h3>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {order.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
