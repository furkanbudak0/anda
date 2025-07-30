/* eslint-disable react/prop-types */
import { useParams, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  TruckIcon,
  EnvelopeIcon,
  PrinterIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { formatPrice, formatDate } from "../utils/formatters";

export default function OrderSuccess() {
  const { orderId } = useParams();
  const location = useLocation();
  const orderFromState = location.state?.order;

  // Fetch order details if not available in state
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetch(`/api/orders/${orderId}`).then((res) => res.json()),
    enabled: !orderFromState && !!orderId,
    initialData: orderFromState,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Sipariş Bulunamadı
          </h1>
          <Link to="/" className="text-orange-600 hover:text-orange-800">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Siparişiniz Alındı!
          </h1>

          <p className="text-lg text-gray-600 mb-6">
            Teşekkür ederiz! Siparişiniz başarıyla oluşturuldu ve en kısa sürede
            işleme alınacak.
          </p>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 inline-block">
            <div className="text-sm text-gray-500 mb-1">Sipariş Numarası</div>
            <div className="text-2xl font-bold text-purple-600">
              {order.order_number}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Order Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Sipariş Bilgileri
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Sipariş Tarihi:</span>
                <span className="font-medium">
                  {formatDate(order.created_at)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Ödeme Yöntemi:</span>
                <span className="font-medium">
                  {order.payment_method === "credit_card"
                    ? "Kredi Kartı"
                    : "Banka Havalesi"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Ödeme Durumu:</span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {order.payment_status === "paid" ? "Ödendi" : "Beklemede"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Toplam Tutar:</span>
                <span className="text-xl font-bold text-purple-600">
                  {formatPrice(order.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Teslimat Bilgileri
            </h2>

            <div className="space-y-4">
              <div>
                <div className="text-gray-500 text-sm mb-1">
                  Teslimat Adresi:
                </div>
                <div className="font-medium">
                  {order.shipping_address?.first_name}{" "}
                  {order.shipping_address?.last_name}
                </div>
                <div className="text-gray-600 text-sm">
                  {order.shipping_address?.address_line_1}
                  {order.shipping_address?.address_line_2 && (
                    <>, {order.shipping_address.address_line_2}</>
                  )}
                </div>
                <div className="text-gray-600 text-sm">
                  {order.shipping_address?.city},{" "}
                  {order.shipping_address?.postal_code}
                </div>
              </div>

              <div>
                <div className="text-gray-500 text-sm mb-1">Kargo Yöntemi:</div>
                <div className="font-medium">
                  {order.shipping_method === "standard"
                    ? "Standart Kargo (5-7 gün)"
                    : order.shipping_method === "express"
                    ? "Hızlı Kargo (2-3 gün)"
                    : "Ertesi Gün Teslimat"}
                </div>
              </div>

              <div>
                <div className="text-gray-500 text-sm mb-1">
                  Tahmini Teslimat:
                </div>
                <div className="font-medium">
                  {/* Calculate estimated delivery based on shipping method */}
                  {(() => {
                    const deliveryDate = new Date(order.created_at);
                    const daysToAdd =
                      order.shipping_method === "standard"
                        ? 7
                        : order.shipping_method === "express"
                        ? 3
                        : 1;
                    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
                    return formatDate(deliveryDate);
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Sipariş Detayları
          </h2>

          <div className="space-y-4">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-4 py-4 border-b border-gray-100 last:border-b-0"
              >
                <img
                  src={item.product?.images?.[0] || "/placeholder-product.jpg"}
                  alt={item.product_title}
                  className="w-16 h-16 object-cover rounded-lg"
                />

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900">
                    {item.product_title}
                  </h3>
                  {item.variant_title && (
                    <p className="text-sm text-gray-500">
                      {item.variant_title}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">Adet: {item.quantity}</p>
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatPrice(item.total_price)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatPrice(item.unit_price)} x {item.quantity}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Ara Toplam:</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kargo:</span>
                <span>{formatPrice(order.shipping_cost || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>KDV:</span>
                <span>{formatPrice(order.tax_amount || 0)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>İndirim:</span>
                  <span>-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-lg">
                <span>Toplam:</span>
                <span className="text-purple-600">
                  {formatPrice(order.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
            <PrinterIcon className="w-4 h-4" />
            Siparişi Yazdır
          </button>

          <button className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
            <EnvelopeIcon className="w-4 h-4" />
            E-posta Gönder
          </button>

          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <TruckIcon className="w-4 h-4" />
            Siparişlerimi Gör
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {/* Next Steps */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Bundan Sonra Ne Oluyor?
          </h3>

          <div className="space-y-3 text-blue-800">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold">1</span>
              </div>
              <div>
                <div className="font-medium">Sipariş Onayı</div>
                <div className="text-sm">
                  Siparişinizin detayları e-posta ile gönderilecek
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold">2</span>
              </div>
              <div>
                <div className="font-medium">Hazırlanıyor</div>
                <div className="text-sm">
                  Satıcılar ürünlerinizi hazırlamaya başlayacak
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold">3</span>
              </div>
              <div>
                <div className="font-medium">Kargoya Verildi</div>
                <div className="text-sm">
                  Takip numaranız e-posta ile gönderilecek
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold">4</span>
              </div>
              <div>
                <div className="font-medium">Teslim Edildi</div>
                <div className="text-sm">
                  Ürünleriniz adresinize teslim edilecek
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Shopping */}
        <div className="text-center mt-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium"
          >
            ← Alışverişe Devam Et
          </Link>
        </div>
      </div>
    </div>
  );
}
