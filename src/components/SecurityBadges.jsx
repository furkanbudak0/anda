/* eslint-disable react/prop-types */
import {
  LockClosedIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  CreditCardIcon,
  EyeSlashIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

/**
 * SECURITY BADGES COMPONENT
 * SSL indicators ve güvenlik rozetleri - kullanıcı güveni artırma
 */

/**
 * SSL Certificate Indicator
 */
export function SSLIndicator({ className = "", size = "sm" }) {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div
      className={`inline-flex items-center gap-1 bg-green-100 text-green-800 rounded-full font-medium ${sizeClasses[size]} ${className}`}
    >
      <LockClosedIcon className={iconSizes[size]} />
      <span>SSL Güvenli</span>
    </div>
  );
}

/**
 * Payment Security Badge
 */
export function PaymentSecurityBadge({ className = "", variant = "default" }) {
  const variants = {
    default: "bg-blue-100 text-blue-800 border-blue-200",
    success: "bg-green-100 text-green-800 border-green-200",
    premium:
      "bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border-purple-200",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${variants[variant]} ${className}`}
    >
      <ShieldCheckIcon className="w-5 h-5" />
      <div className="text-left">
        <div className="text-sm font-semibold">Güvenli Ödeme</div>
        <div className="text-xs opacity-75">256-bit SSL Şifreleme</div>
      </div>
    </div>
  );
}

/**
 * Trust Badges Collection
 */
export function TrustBadges({ layout = "horizontal", className = "" }) {
  const badges = [
    {
      icon: LockClosedIcon,
      title: "SSL Sertifikalı",
      description: "Verileriniz şifreli",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: ShieldCheckIcon,
      title: "Güvenli Alışveriş",
      description: "PCI DSS uyumlu",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: CheckBadgeIcon,
      title: "Onaylı Satıcılar",
      description: "Doğrulanmış mağazalar",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: TruckIcon,
      title: "Güvenli Teslimat",
      description: "Kargo garantisi",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const layoutClasses = {
    horizontal: "flex flex-wrap gap-4",
    vertical: "space-y-3",
    grid: "grid grid-cols-2 md:grid-cols-4 gap-4",
  };

  return (
    <div className={`${layoutClasses[layout]} ${className}`}>
      {badges.map((badge, index) => (
        <div
          key={index}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${badge.bgColor}`}
        >
          <badge.icon className={`w-5 h-5 ${badge.color}`} />
          <div>
            <div className={`text-sm font-medium ${badge.color}`}>
              {badge.title}
            </div>
            <div className="text-xs text-gray-600">{badge.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Privacy Protection Badge
 */
export function PrivacyBadge({ className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-800 rounded-lg ${className}`}
    >
      <EyeSlashIcon className="w-4 h-4" />
      <span className="text-sm font-medium">Gizlilik Korumalı</span>
    </div>
  );
}

/**
 * PCI Compliance Badge
 */
export function PCIComplianceBadge({ className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg ${className}`}
    >
      <CreditCardIcon className="w-5 h-5" />
      <div className="text-left">
        <div className="text-sm font-semibold">PCI DSS</div>
        <div className="text-xs opacity-90">Sertifikalı</div>
      </div>
    </div>
  );
}

/**
 * Security Footer Component
 */
export function SecurityFooter({ className = "" }) {
  return (
    <div className={`bg-gray-50 dark:bg-gray-800 py-8 border-t ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Güvenli Alışveriş Garantisi
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Verileriniz 256-bit SSL şifreleme ile korunur
          </p>
        </div>

        <TrustBadges layout="grid" className="max-w-4xl mx-auto" />

        <div className="flex flex-wrap justify-center items-center gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <SSLIndicator size="md" />
          <PCIComplianceBadge />
          <PrivacyBadge />
        </div>

        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ANDA olarak müşterilerimizin güvenliği bizim önceliğimizdir. Tüm
            ödemeler bankalar arası güvenli bağlantı ile şifrelenir.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Checkout Security Component
 */
export function CheckoutSecurity({ className = "" }) {
  return (
    <div
      className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <ShieldCheckIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-green-800 font-semibold mb-1">
            Güvenli Ödeme Garantisi
          </h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• 256-bit SSL şifreleme ile korumalı</li>
            <li>• PCI DSS Level 1 sertifikalı</li>
            <li>• Kart bilgileriniz saklanmaz</li>
            <li>• 7/24 fraud protection</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Security Indicator for Page Header
 */
export function PageSecurityIndicator({ className = "" }) {
  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-3 py-2 border">
        <div className="flex items-center gap-2">
          <LockClosedIcon className="w-4 h-4 text-green-600" />
          <span className="text-xs font-medium text-gray-900 dark:text-white">
            Güvenli Bağlantı
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SecurityBadges() {
  return <TrustBadges />;
}
