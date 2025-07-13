import { useState } from "react";
import { BoltIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useExpressCheckout } from "../hooks/useExpressCheckout";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

/**
 * Express Checkout Button Component
 * Tek tıkla satın alma butonu
 */
export default function ExpressCheckoutButton({
  product,
  variant = null,
  quantity = 1,
  className = "",
  size = "md",
  showIcon = true,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { isAuthenticated } = useAuth();
  const {
    expressCheckout,
    checkExpressEligibility,
    defaultOptions,
    optionsLoading,
  } = useExpressCheckout();

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };

  const handleExpressCheckout = async () => {
    if (!isAuthenticated) {
      toast.error("Hızlı satın alma için giriş yapmalısınız");
      return;
    }

    setIsProcessing(true);

    try {
      // Önce uygunluk kontrolü yap
      const eligibility = await checkExpressEligibility(product.id, quantity);

      if (!eligibility.isEligible) {
        throw new Error(eligibility.reason);
      }

      // Express checkout başlat
      const result = await expressCheckout.mutateAsync({
        productId: product.id,
        variantId: variant?.id,
        quantity,
        useDefaults: true,
      });

      toast.success("Siparişiniz başarıyla oluşturuldu!");

      // Success sayfasına yönlendir
      window.location.href = `/order-success/${result.order.id}?express=true`;
    } catch (error) {
      console.error("Express checkout error:", error);

      if (error.message === "LOGIN_REQUIRED") {
        toast.error("Satın alma için giriş yapmalısınız");
      } else if (error.message === "SETUP_REQUIRED") {
        toast.error("Varsayılan adres ve ödeme yöntemi ayarlamanız gerekiyor");
        // Setup sayfasına yönlendir
        window.location.href = "/account/payment-methods";
      } else {
        toast.error(error.message || "Bir hata oluştu");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Kullanıcı giriş yapmamışsa veya varsayılan bilgiler eksikse
  if (!isAuthenticated) {
    return (
      <button
        onClick={() => toast.error("Hızlı satın alma için giriş yapmalısınız")}
        className={`
          inline-flex items-center justify-center gap-2 font-medium
          rounded-lg border transition-all duration-200
          bg-gradient-to-r from-purple-600 to-indigo-600 
          text-white border-transparent
          hover:from-purple-700 hover:to-indigo-700
          hover:shadow-lg hover:scale-105
          ${sizeClasses[size]} ${className}
        `}
      >
        {showIcon && <BoltIcon className="w-4 h-4" />}
        Hızlı Satın Al
      </button>
    );
  }

  // Loading state
  if (optionsLoading) {
    return (
      <button
        disabled
        className={`
          inline-flex items-center justify-center gap-2 font-medium
          rounded-lg border transition-all duration-200
          bg-gray-300 text-gray-500 border-gray-300
          cursor-not-allowed
          ${sizeClasses[size]} ${className}
        `}
      >
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        Yükleniyor...
      </button>
    );
  }

  // Ana buton
  return (
    <button
      onClick={handleExpressCheckout}
      disabled={isProcessing || !product?.is_active}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        rounded-lg border transition-all duration-200 relative overflow-hidden
        ${
          isProcessing || !product?.is_active
            ? "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
            : `bg-gradient-to-r from-purple-600 to-indigo-600 
               text-white border-transparent
               hover:from-purple-700 hover:to-indigo-700
               hover:shadow-lg hover:scale-105 active:scale-95
               focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`
        }
        ${sizeClasses[size]} ${className}
      `}
    >
      {/* Shimmer effect */}
      {!isProcessing && product?.is_active && (
        <div className="absolute inset-0 -top-[1px] -bottom-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shimmer" />
      )}

      {/* Icon */}
      {showIcon && (
        <div className="relative">
          {isProcessing ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <SparklesIcon className="w-4 h-4" />
          )}
        </div>
      )}

      {/* Text */}
      <span className="relative">
        {isProcessing ? "İşleniyor..." : "Hızlı Satın Al"}
      </span>
    </button>
  );
}

/**
 * Express Checkout Info Badge
 * Hızlı satın alma bilgi kartı
 */
export function ExpressCheckoutInfo({ className = "" }) {
  return (
    <div
      className={`bg-purple-50 border border-purple-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <BoltIcon className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-medium text-purple-900 mb-1">
            Hızlı Satın Al
          </h4>
          <p className="text-xs text-purple-700">
            Varsayılan adres ve ödeme yönteminizle tek tıkla satın alın
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Express Checkout Setup Prompt
 * Kurulum gereken durumlarda gösterilir
 */
export function ExpressCheckoutSetup({ onSetup, className = "" }) {
  return (
    <div
      className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <BoltIcon className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-amber-900 mb-1">
              Hızlı Satın Al'ı Aktifleştir
            </h4>
            <p className="text-xs text-amber-700 mb-2">
              Varsayılan adres ve ödeme yöntemi ayarlayarak tek tıkla alışveriş
              yapın
            </p>
          </div>
        </div>
        <button
          onClick={onSetup}
          className="text-xs bg-amber-600 text-white px-3 py-1 rounded-md hover:bg-amber-700 transition-colors flex-shrink-0"
        >
          Ayarla
        </button>
      </div>
    </div>
  );
}
