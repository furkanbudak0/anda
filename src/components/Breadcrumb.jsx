/* eslint-disable react/prop-types */
import { Link, useLocation } from "react-router-dom";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import { useMemo } from "react";

/**
 * KAPSAMLI BREADCRUMB NAVİGASYON SİSTEMİ
 *
 * Özellikler:
 * - Otomatik path analizi
 * - Özel sayfa isimleri
 * - Kategori ve ürün desteği
 * - Dinamik başlıklar
 * - Mobile responsive
 * - Dark mode desteği
 */

export default function Breadcrumb({
  customItems = null,
  className = "",
  showHome = true,
  maxItems = 4,
}) {
  const location = useLocation();

  const breadcrumbItems = useMemo(() => {
    if (customItems) return customItems;

    const pathSegments = location.pathname.split("/").filter(Boolean);

    const items = [];

    if (showHome) {
      items.push({
        label: "Ana Sayfa",
        path: "/",
        icon: HomeIcon,
      });
    }

    let currentPath = "";

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      const item = {
        label: getBreadcrumbLabel(segment, pathSegments, index),
        path: currentPath,
        isLast: index === pathSegments.length - 1,
      };

      // Özel durumlar için path kontrolü
      if (shouldSkipSegment(segment, pathSegments, index)) {
        return;
      }

      items.push(item);
    });

    // Maksimum öğe sınırı uygula
    if (items.length > maxItems) {
      const firstItem = items[0];
      const lastItems = items.slice(-maxItems + 2);
      return [
        firstItem,
        { label: "...", path: "#", isEllipsis: true },
        ...lastItems,
      ];
    }

    return items;
  }, [location.pathname, customItems, showHome, maxItems]);

  if (!breadcrumbItems.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={`py-3 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbItems.map((item, index) => (
            <li key={index} className="flex items-center">
              {/* Separator */}
              {index > 0 && (
                <ChevronRightIcon
                  className="w-4 h-4 text-gray-400 mx-2"
                  aria-hidden="true"
                />
              )}

              {/* Breadcrumb Item */}
              {item.isEllipsis ? (
                <span className="text-gray-500 cursor-default">
                  {item.label}
                </span>
              ) : item.isLast ? (
                <span
                  className="text-gray-900 dark:text-white font-medium"
                  aria-current="page"
                >
                  {item.icon && <item.icon className="w-4 h-4 inline mr-1" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors"
                >
                  {item.icon && <item.icon className="w-4 h-4 inline mr-1" />}
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

/**
 * Segment için uygun etiket döndürür
 */
function getBreadcrumbLabel(segment, pathSegments, index) {
  const routeLabels = {
    // Ana bölümler
    products: "Ürünler",
    product: "Ürün Detayı",
    category: "Kategori",
    cart: "Sepet",
    checkout: "Ödeme",
    account: "Hesabım",
    favorites: "Favorilerim",
    orders: "Siparişlerim",

    // Satıcı bölümleri
    seller: "Satıcı",
    dashboard: "Panel",
    inventory: "Stok Yönetimi",
    analytics: "Analitik",

    // Admin bölümleri
    admin: "Admin",
    users: "Kullanıcılar",
    sellers: "Satıcılar",
    campaigns: "Kampanyalar",
    algorithm: "Algoritma",
    content: "İçerik",
    settings: "Ayarlar",

    // Diğer sayfalar
    auth: "Giriş Yap",
    help: "Yardım",
    contact: "İletişim",
    track: "Sipariş Takibi",
    "track-order": "Sipariş Takibi",
    "best-sellers": "En Çok Satanlar",
    "new-arrivals": "Yeni Gelenler",

    // Kategoriler
    erkek: "Erkek",
    kadin: "Kadın",
    ayakkabi: "Ayakkabı",
    aksesuar: "Aksesuar",
    elektronik: "Elektronik",
  };

  // Özel durumları kontrol et
  if (segment.startsWith("track") && pathSegments[index - 1] === "track") {
    return `Takip: ${segment.toUpperCase()}`;
  }

  if (pathSegments[index - 1] === "product") {
    return formatProductName(segment);
  }

  if (pathSegments[index - 1] === "seller") {
    return formatSellerName(segment);
  }

  if (pathSegments[index - 1] === "category") {
    return formatCategoryName(segment);
  }

  if (pathSegments[index - 1] === "order-success") {
    return `Sipariş #${segment}`;
  }

  return routeLabels[segment] || formatSegment(segment);
}

/**
 * Hangi segmentlerin atlanacağını belirler
 */
function shouldSkipSegment(segment, pathSegments, index) {
  // UUID formatındaki ID'leri atla (order-success hariç)
  if (isUUID(segment) && pathSegments[index - 1] !== "order-success") {
    return true;
  }

  // Numeric ID'leri atla
  if (/^\d+$/.test(segment)) {
    return true;
  }

  return false;
}

/**
 * Ürün adını formatlar
 */
function formatProductName(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Satıcı adını formatlar
 */
function formatSellerName(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Kategori adını formatlar
 */
function formatCategoryName(slug) {
  const categories = {
    erkek: "Erkek",
    kadin: "Kadın",
    ayakkabi: "Ayakkabı",
    aksesuar: "Aksesuar",
    elektronik: "Elektronik",
  };

  return categories[slug] || formatSegment(slug);
}

/**
 * Genel segment formatlaması
 */
function formatSegment(segment) {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * UUID kontrolü
 */
function isUUID(str) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Özel breadcrumb öğeleri oluşturmak için yardımcı fonksiyonlar
 */
export function createBreadcrumbItem(label, path, options = {}) {
  return {
    label,
    path,
    icon: options.icon,
    isLast: options.isLast || false,
    ...options,
  };
}

export function createBreadcrumbsFromPath(customPath, customLabels = {}) {
  const segments = customPath.split("/").filter(Boolean);
  const items = [{ label: "Ana Sayfa", path: "/", icon: HomeIcon }];

  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    items.push({
      label: customLabels[segment] || formatSegment(segment),
      path: currentPath,
      isLast: index === segments.length - 1,
    });
  });

  return items;
}

/**
 * Özelleştirilmiş breadcrumb hook'u
 */
export function useBreadcrumb(customItems = null) {
  const location = useLocation();

  return useMemo(() => {
    if (customItems) return customItems;

    // Breadcrumb mantığı burada...
    return createBreadcrumbsFromPath(location.pathname);
  }, [location.pathname, customItems]);
}
