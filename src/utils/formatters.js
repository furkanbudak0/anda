/**
 * Format price in Turkish Lira
 */
export function formatPrice(price, options = {}) {
  const {
    showCurrency = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  if (price === null || price === undefined) {
    return showCurrency ? "0,00 ₺" : "0,00";
  }

  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(price);

  return showCurrency ? `${formatted} ₺` : formatted;
}

/**
 * Format compact price (1.2K, 1.5M, etc.)
 */
export function formatCompactPrice(price) {
  if (price === null || price === undefined) return "0 ₺";

  const formatter = new Intl.NumberFormat("tr-TR", {
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

  return `${formatter.format(price)} ₺`;
}

/**
 * Format date in Turkish locale
 */
export function formatDate(date, options = {}) {
  const {
    dateStyle = "medium",
    timeStyle = undefined,
    relative = false,
  } = options;

  if (!date) return "";

  const dateObj = new Date(date);

  if (relative) {
    return formatRelativeDate(dateObj);
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle,
    timeStyle,
  }).format(dateObj);
}

/**
 * Format relative date (2 hours ago, 3 days ago, etc.)
 */
export function formatRelativeDate(date) {
  if (!date) return "";

  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

  const intervals = [
    { label: "yıl", seconds: 31536000 },
    { label: "ay", seconds: 2592000 },
    { label: "gün", seconds: 86400 },
    { label: "saat", seconds: 3600 },
    { label: "dakika", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label} önce`;
    }
  }

  return "Az önce";
}

/**
 * Format number with thousand separators
 */
export function formatNumber(number, options = {}) {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    notation = "standard",
  } = options;

  if (number === null || number === undefined) return "0";

  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits,
    maximumFractionDigits,
    notation,
  }).format(number);
}

/**
 * Format compact number (1.2K, 1.5M, etc.)
 */
export function formatCompactNumber(number) {
  if (number === null || number === undefined) return "0";

  return new Intl.NumberFormat("tr-TR", {
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(number);
}

/**
 * Format percentage
 */
export function formatPercentage(value, options = {}) {
  const { minimumFractionDigits = 0, maximumFractionDigits = 1 } = options;

  if (value === null || value === undefined) return "0%";

  return new Intl.NumberFormat("tr-TR", {
    style: "percent",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value / 100);
}

/**
 * Format file size
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${
    sizes[i]
  }`;
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone) {
  if (!phone) return "";

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Turkish phone number format: +90 (555) 123 45 67
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    const formatted = cleaned.slice(1);
    return `+90 (${formatted.slice(0, 3)}) ${formatted.slice(
      3,
      6
    )} ${formatted.slice(6, 8)} ${formatted.slice(8)}`;
  }

  if (cleaned.length === 10) {
    return `+90 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(
      6,
      8
    )} ${cleaned.slice(8)}`;
  }

  return phone; // Return original if format is not recognized
}

/**
 * Format address for display
 */
export function formatAddress(address) {
  if (!address) return "";

  const parts = [
    address.address_line_1,
    address.address_line_2,
    address.city,
    address.state_province,
    address.postal_code,
    address.country,
  ].filter(Boolean);

  return parts.join(", ");
}

/**
 * Format order status for display
 */
export function formatOrderStatus(status) {
  const statusMap = {
    pending: "Beklemede",
    processing: "İşleniyor",
    shipped: "Kargoya Verildi",
    delivered: "Teslim Edildi",
    cancelled: "İptal Edildi",
    refunded: "İade Edildi",
  };

  return statusMap[status] || status;
}

/**
 * Format payment status for display
 */
export function formatPaymentStatus(status) {
  const statusMap = {
    pending: "Beklemede",
    paid: "Ödendi",
    partially_paid: "Kısmi Ödendi",
    refunded: "İade Edildi",
    cancelled: "İptal Edildi",
    failed: "Başarısız",
  };

  return statusMap[status] || status;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return "";

  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Generate slug from text
 */
export function generateSlug(text) {
  if (!text) return "";

  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim("-");
}

/**
 * Format rating with stars
 */
export function formatRating(rating, options = {}) {
  const { showNumber = true, maxStars = 5 } = options;

  if (rating === null || rating === undefined) {
    return showNumber ? "0.0" : "";
  }

  const stars =
    "★".repeat(Math.floor(rating)) + "☆".repeat(maxStars - Math.floor(rating));

  return showNumber ? `${stars} (${rating.toFixed(1)})` : stars;
}

/**
 * Format discount percentage
 */
export function formatDiscount(originalPrice, discountedPrice) {
  if (!originalPrice || !discountedPrice || originalPrice <= discountedPrice) {
    return null;
  }

  const discountPercentage =
    ((originalPrice - discountedPrice) / originalPrice) * 100;
  return Math.round(discountPercentage);
}
