import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

import NavBar from "../components/NavBar";
import Spinner from "../components/Spinner";

const statusConfig = {
  pending: {
    icon: ClockIcon,
    color: "text-yellow-600 bg-yellow-100",
    text: "Beklemede",
    description: "Siparişiniz hazırlanıyor",
  },
  processing: {
    icon: ClockIcon,
    color: "text-blue-600 bg-blue-100",
    text: "Hazırlanıyor",
    description: "Siparişiniz hazırlanıyor",
  },
  shipped: {
    icon: TruckIcon,
    color: "text-purple-600 bg-purple-100",
    text: "Kargoya Verildi",
    description: "Siparişiniz kargo firmasına teslim edildi",
  },
  in_transit: {
    icon: TruckIcon,
    color: "text-indigo-600 bg-indigo-100",
    text: "Yolda",
    description: "Siparişiniz size doğru yolda",
  },
  out_for_delivery: {
    icon: TruckIcon,
    color: "text-orange-600 bg-orange-100",
    text: "Dağıtımda",
    description: "Siparişiniz teslimat için çıktı",
  },
  delivered: {
    icon: CheckCircleIcon,
    color: "text-green-600 bg-green-100",
    text: "Teslim Edildi",
    description: "Siparişiniz başarıyla teslim edildi",
  },
  failed_delivery: {
    icon: ExclamationTriangleIcon,
    color: "text-red-600 bg-red-100",
    text: "Teslimat Başarısız",
    description: "Teslimat gerçekleştirilemedi",
  },
  returned: {
    icon: ExclamationTriangleIcon,
    color: "text-gray-600 bg-gray-100",
    text: "İade Edildi",
    description: "Sipariş geri gönderildi",
  },
  cancelled: {
    icon: ExclamationTriangleIcon,
    color: "text-red-600 bg-red-100",
    text: "İptal Edildi",
    description: "Sipariş iptal edildi",
  },
};

export default function OrderTracking() {
  const { trackingCode } = useParams();
  const navigate = useNavigate();
  const [inputTrackingCode, setInputTrackingCode] = useState(
    trackingCode || ""
  );
  const [searchAttempted, setSearchAttempted] = useState(!!trackingCode);

  const {
    data: trackingData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["order-tracking", trackingCode],
    queryFn: async () => {
      if (!trackingCode) return null;

      const { data, error } = await supabase
        .from("public_order_tracking")
        .select(
          `
          *,
          order:orders(
            id,
            order_number,
            total_amount,
            created_at,
            shipping_address,
            order_items(
              id,
              quantity,
              price,
              product:products(name, image_url),
              variant:product_variants(title)
            )
          )
        `
        )
        .eq("tracking_code", trackingCode)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Takip kodu bulunamadı");
        }
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!trackingCode && searchAttempted,
    retry: false,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!inputTrackingCode.trim()) {
      toast.error("Lütfen takip kodu giriniz");
      return;
    }

    setSearchAttempted(true);
    if (inputTrackingCode !== trackingCode) {
      navigate(`/track/${inputTrackingCode}`);
    } else {
      refetch();
    }
  };

  const currentStatus = trackingData?.current_status;
  const statusInfo = statusConfig[currentStatus] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const parseStatusHistory = (historyJson) => {
    try {
      return Array.isArray(historyJson)
        ? historyJson
        : JSON.parse(historyJson || "[]");
    } catch {
      return [];
    }
  };

  const statusHistory = trackingData
    ? parseStatusHistory(trackingData.public_status_history)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Sipariş Takibi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sipariş takip kodunuzla siparişinizin durumunu öğrenin
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="tracking-code" className="sr-only">
                Takip Kodu
              </label>
              <input
                id="tracking-code"
                type="text"
                value={inputTrackingCode}
                onChange={(e) => setInputTrackingCode(e.target.value)}
                placeholder="Takip kodunuzu giriniz (örn: TR20241201ABCD1234)"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                <MagnifyingGlassIcon className="h-5 w-5" />
              )}
              Sorgula
            </button>
          </form>
        </div>

        {/* Results */}
        {searchAttempted && (
          <>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-8">
                <div className="flex items-center gap-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  <div>
                    <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                      Sipariş Bulunamadı
                    </h3>
                    <p className="text-red-700 dark:text-red-300 mt-1">
                      {error.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {trackingData && (
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Sipariş Detayları
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <dl className="space-y-3">
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Sipariş Numarası
                            </dt>
                            <dd className="text-sm text-gray-900 dark:text-white font-mono">
                              {trackingData.order.order_number}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Takip Kodu
                            </dt>
                            <dd className="text-sm text-gray-900 dark:text-white font-mono">
                              {trackingData.tracking_code}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Sipariş Tarihi
                            </dt>
                            <dd className="text-sm text-gray-900 dark:text-white">
                              {new Date(
                                trackingData.order.created_at
                              ).toLocaleDateString("tr-TR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <dl className="space-y-3">
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Toplam Tutar
                            </dt>
                            <dd className="text-sm text-gray-900 dark:text-white font-semibold">
                              ₺{trackingData.order.total_amount.toFixed(2)}
                            </dd>
                          </div>
                          {trackingData.estimated_delivery && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Tahmini Teslimat
                              </dt>
                              <dd className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                {new Date(
                                  trackingData.estimated_delivery
                                ).toLocaleDateString("tr-TR", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </dd>
                            </div>
                          )}
                          {trackingData.order.shipping_address && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Teslimat Adresi
                              </dt>
                              <dd className="text-sm text-gray-900 dark:text-white flex items-start gap-1">
                                <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>
                                  {typeof trackingData.order
                                    .shipping_address === "string"
                                    ? trackingData.order.shipping_address
                                    : `${trackingData.order.shipping_address.address}, ${trackingData.order.shipping_address.city}`}
                                </span>
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Status */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-full ${statusInfo.color}`}>
                      <StatusIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {statusInfo.text}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {trackingData.status_description ||
                          statusInfo.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status History */}
                {statusHistory.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Sipariş Geçmişi
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="flow-root">
                        <ul className="-mb-8">
                          {statusHistory.map((status, index) => {
                            const historyStatusInfo =
                              statusConfig[status.status] ||
                              statusConfig.pending;
                            const HistoryIcon = historyStatusInfo.icon;

                            return (
                              <li key={index}>
                                <div className="relative pb-8">
                                  {index !== statusHistory.length - 1 && (
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600" />
                                  )}
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span
                                        className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${historyStatusInfo.color}`}
                                      >
                                        <HistoryIcon className="h-4 w-4" />
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                      <div>
                                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                                          {historyStatusInfo.text}
                                        </p>
                                        {status.description && (
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {status.description}
                                          </p>
                                        )}
                                        {status.location && (
                                          <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1">
                                            <MapPinIcon className="h-3 w-3" />
                                            {status.location}
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                        <time dateTime={status.timestamp}>
                                          {new Date(
                                            status.timestamp
                                          ).toLocaleDateString("tr-TR", {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </time>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Sipariş İçeriği
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {trackingData.order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                        >
                          <div className="flex-shrink-0">
                            <img
                              src={
                                item.product.image_url?.[0] ||
                                "/placeholder-product.jpg"
                              }
                              alt={item.product.name}
                              className="h-16 w-16 object-cover rounded-lg"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {item.product.name}
                            </h4>
                            {item.variant?.title && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {item.variant.title}
                              </p>
                            )}
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              Adet: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              ₺{(item.price * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              ₺{item.price.toFixed(2)} / adet
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
