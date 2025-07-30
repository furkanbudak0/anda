import React, { useState } from "react";
import {
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  useOrderTracking,
  useOrderStatusHistory,
} from "../../hooks/useOrderTracking";
import { formatPrice } from "../../utils/formatters";

const STATUS_CONFIG = {
  pending: {
    label: "Sipariş Alındı",
    color: "yellow",
    icon: "📋",
    description: "Siparişiniz alındı ve işleme konuldu",
  },
  processing: {
    label: "Hazırlanıyor",
    color: "blue",
    icon: "📦",
    description: "Siparişiniz paketleniyor",
  },
  shipped: {
    label: "Kargoya Verildi",
    color: "orange",
    icon: "🚚",
    description: "Siparişiniz kargo firmasına teslim edildi",
  },
  in_transit: {
    label: "Yolda",
    color: "indigo",
    icon: "🛣️",
    description: "Siparişiniz size doğru yolda",
  },
  out_for_delivery: {
    label: "Dağıtımda",
    color: "green",
    icon: "🏃‍♂️",
    description: "Siparişiniz bugün teslim edilecek",
  },
  delivered: {
    label: "Teslim Edildi",
    color: "green",
    icon: "🎉",
    description: "Siparişiniz başarıyla teslim edildi",
  },
  failed: {
    label: "Teslim Edilemedi",
    color: "red",
    icon: "❌",
    description: "Sipariş teslim edilemedi",
  },
  returned: {
    label: "İade Edildi",
    color: "gray",
    icon: "↩️",
    description: "Sipariş iade işlemi tamamlandı",
  },
};

export default function OrderTracking({ orderId }) {
  const {
    data: trackingData,
    isLoading: trackingLoading,
    error: trackingError,
  } = useOrderTracking(orderId);
  const { data: statusHistory, isLoading: historyLoading } =
    useOrderStatusHistory(orderId);

  if (trackingLoading || historyLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (trackingError) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Takip Bilgisi Bulunamadı
          </h3>
          <p className="text-gray-600">
            Bu sipariş için henüz kargo takip bilgisi bulunmamaktadır.
          </p>
        </div>
      </div>
    );
  }

  const currentTracking = trackingData?.[0];
  const currentStatus = currentTracking?.status || "pending";
  const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 p-8">
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
          <TruckIcon className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Sipariş Takibi</h2>
      </div>

      {/* Mevcut Durum */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-lg bg-${statusConfig.color}-100`}>
            <span className="text-2xl">{statusConfig.icon}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {statusConfig.label}
            </h3>
            <p className="text-gray-600">{statusConfig.description}</p>
          </div>
        </div>

        {/* Kargo Bilgileri */}
        {currentTracking && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {currentTracking.tracking_number && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TruckIcon className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">
                    Takip Numarası
                  </span>
                </div>
                <p className="text-gray-700 font-mono">
                  {currentTracking.tracking_number}
                </p>
              </div>
            )}

            {currentTracking.shipping_company && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPinIcon className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">
                    Kargo Firması
                  </span>
                </div>
                <p className="text-gray-700">
                  {currentTracking.shipping_company}
                </p>
              </div>
            )}

            {currentTracking.current_location && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPinIcon className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">
                    Mevcut Konum
                  </span>
                </div>
                <p className="text-gray-700">
                  {currentTracking.current_location}
                </p>
              </div>
            )}

            {currentTracking.estimated_delivery && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">
                    Tahmini Teslimat
                  </span>
                </div>
                <p className="text-gray-700">
                  {new Date(
                    currentTracking.estimated_delivery
                  ).toLocaleDateString("tr-TR")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Durum Geçmişi */}
      {statusHistory && statusHistory.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            Durum Geçmişi
          </h3>
          <div className="space-y-4">
            {statusHistory.map((status, index) => {
              const statusInfo =
                STATUS_CONFIG[status.status] || STATUS_CONFIG.pending;
              return (
                <div key={status.id} className="flex items-start gap-4">
                  <div
                    className={`p-2 rounded-full bg-${statusInfo.color}-100 mt-1`}
                  >
                    <span className="text-sm">{statusInfo.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {statusInfo.label}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {new Date(status.created_at).toLocaleDateString(
                          "tr-TR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                    {status.description && (
                      <p className="text-gray-600 text-sm">
                        {status.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kargo Takip Detayları */}
      {currentTracking?.shipping_tracking_details &&
        currentTracking.shipping_tracking_details.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Kargo Takip Detayları
            </h3>
            <div className="space-y-4">
              {currentTracking.shipping_tracking_details.map(
                (detail, index) => (
                  <div key={detail.id} className="flex items-start gap-4">
                    <div className="p-2 rounded-full bg-blue-100 mt-1">
                      <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {detail.status}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {new Date(detail.timestamp).toLocaleDateString(
                            "tr-TR",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                      {detail.location && (
                        <p className="text-gray-600 text-sm mb-1">
                          📍 {detail.location}
                        </p>
                      )}
                      {detail.description && (
                        <p className="text-gray-600 text-sm">
                          {detail.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
    </div>
  );
}
