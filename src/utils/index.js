/**
 * MERKEZI UTILITY EXPORT SİSTEMİ
 *
 * Tüm utility fonksiyonlarını tek bir yerden export eden merkezi sistem.
 * Tekrarlanan utility imports'ları elimine eder ve tutarlılık sağlar.
 */

// Re-export all utilities from their respective modules
export * from "./formatters";
export * from "./validation";
export * from "./propValidation";
export * from "./logger";
export * from "./notifications";
export * from "./seo";
export * from "./bringToFrontAndCenter";

// Common utility functions (frequently used across the app)
export const utils = {
  // String utilities
  capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),

  truncate: (str, length = 100, suffix = "...") => {
    if (str.length <= length) return str;
    return str.substring(0, length).trim() + suffix;
  },

  slugify: (str) => {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  },

  // Array utilities
  unique: (arr) => [...new Set(arr)],

  groupBy: (arr, key) => {
    return arr.reduce((groups, item) => {
      const group = typeof key === "function" ? key(item) : item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  sortBy: (arr, key, direction = "asc") => {
    return [...arr].sort((a, b) => {
      const aVal = typeof key === "function" ? key(a) : a[key];
      const bVal = typeof key === "function" ? key(b) : b[key];

      if (direction === "desc") {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });
  },

  // Object utilities
  pick: (obj, keys) => {
    return keys.reduce((result, key) => {
      if (key in obj) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  },

  omit: (obj, keys) => {
    const result = { ...obj };
    keys.forEach((key) => delete result[key]);
    return result;
  },

  deepClone: (obj) => {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map((item) => utils.deepClone(item));
    if (typeof obj === "object") {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = utils.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  },

  // Number utilities
  clamp: (number, min, max) => Math.min(Math.max(number, min), max),

  random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

  percentage: (value, total) => Math.round((value / total) * 100),

  // DOM utilities
  scrollToTop: (behavior = "smooth") => {
    window.scrollTo({ top: 0, behavior });
  },

  scrollToElement: (elementId, behavior = "smooth") => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior });
    }
  },

  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    }
  },

  // URL utilities
  getQueryParams: (url = window.location.href) => {
    const params = new URLSearchParams(new URL(url).search);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  },

  buildUrl: (base, params = {}) => {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  },

  // Date utilities
  isToday: (date) => {
    const today = new Date();
    const checkDate = new Date(date);
    return today.toDateString() === checkDate.toDateString();
  },

  isYesterday: (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const checkDate = new Date(date);
    return yesterday.toDateString() === checkDate.toDateString();
  },

  daysBetween: (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1 - date2) / oneDay));
  },

  // Performance utilities
  debounce: (func, wait, immediate = false) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  throttle: (func, limit) => {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Storage utilities
  storage: {
    get: (key, defaultValue = null) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch {
        return defaultValue;
      }
    },

    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },

    remove: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },

    clear: () => {
      try {
        localStorage.clear();
        return true;
      } catch {
        return false;
      }
    },
  },

  // Session storage utilities
  session: {
    get: (key, defaultValue = null) => {
      try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch {
        return defaultValue;
      }
    },

    set: (key, value) => {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },

    remove: (key) => {
      try {
        sessionStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
  },

  // File utilities
  formatFileSize: (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  },

  getFileExtension: (filename) => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
  },

  isImageFile: (filename) => {
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    const extension = utils.getFileExtension(filename).toLowerCase();
    return imageExtensions.includes(extension);
  },

  // Device utilities
  isMobile: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  },

  isTablet: () => {
    return /iPad|Android.*(?!.*Mobile)/i.test(navigator.userAgent);
  },

  isDesktop: () => {
    return !utils.isMobile() && !utils.isTablet();
  },

  // Browser utilities
  getBrowserInfo: () => {
    const userAgent = navigator.userAgent;
    let browser = "Unknown";

    if (userAgent.indexOf("Chrome") > -1) {
      browser = "Chrome";
    } else if (userAgent.indexOf("Firefox") > -1) {
      browser = "Firefox";
    } else if (userAgent.indexOf("Safari") > -1) {
      browser = "Safari";
    } else if (userAgent.indexOf("Edge") > -1) {
      browser = "Edge";
    }

    return {
      name: browser,
      userAgent,
      isMobile: utils.isMobile(),
      isTablet: utils.isTablet(),
      isDesktop: utils.isDesktop(),
    };
  },

  // Color utilities
  hexToRgb: (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  rgbToHex: (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  // Analytics utilities
  trackEvent: (eventName, properties = {}) => {
    if (import.meta.env.PROD && window.gtag) {
      window.gtag("event", eventName, properties);
    } else if (import.meta.env.DEV) {
      console.log("Analytics Event:", eventName, properties);
    }
  },

  // Error utilities
  safeCall: (fn, fallback = null) => {
    try {
      return fn();
    } catch (error) {
      console.error("Safe call error:", error);
      return fallback;
    }
  },

  // Cache utilities
  memoize: (fn) => {
    const cache = new Map();
    return (...args) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  },
};

// E-commerce specific utilities
export const ecommerceUtils = {
  calculateDiscountPercentage: (originalPrice, discountedPrice) => {
    return Math.round(
      ((originalPrice - discountedPrice) / originalPrice) * 100
    );
  },

  formatPrice: (price, currency = "TRY") => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency,
    }).format(price);
  },

  generateSKU: (productName, variant = "") => {
    const slug = utils.slugify(productName + variant);
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    return `${slug}-${randomSuffix}`;
  },

  calculateShippingCost: (weight, distance, freeShippingThreshold = 200) => {
    // Simplified shipping calculation
    const baseRate = 15; // Base shipping cost
    const weightMultiplier = Math.ceil(weight / 500) * 5; // Extra cost per 500g
    const distanceMultiplier = distance > 500 ? 10 : 0; // Extra for long distance

    return baseRate + weightMultiplier + distanceMultiplier;
  },

  isEligibleForFreeShipping: (cartTotal, threshold = 200) => {
    return cartTotal >= threshold;
  },

  calculateInstallments: (price, installmentCount) => {
    return Math.ceil(price / installmentCount);
  },

  validateCreditCard: (cardNumber) => {
    // Luhn algorithm
    const digits = cardNumber.replace(/\D/g, "");
    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },
};

// Turkish specific utilities
export const turkishUtils = {
  toTurkishUpperCase: (str) => {
    return str
      .replace(/ı/g, "I")
      .replace(/i/g, "İ")
      .replace(/ş/g, "Ş")
      .replace(/ğ/g, "Ğ")
      .replace(/ü/g, "Ü")
      .replace(/ö/g, "Ö")
      .replace(/ç/g, "Ç")
      .toUpperCase();
  },

  toTurkishLowerCase: (str) => {
    return str
      .replace(/I/g, "ı")
      .replace(/İ/g, "i")
      .replace(/Ş/g, "ş")
      .replace(/Ğ/g, "ğ")
      .replace(/Ü/g, "ü")
      .replace(/Ö/g, "ö")
      .replace(/Ç/g, "ç")
      .toLowerCase();
  },

  turkishSort: (arr, key = null) => {
    const turkishLocale = "tr-TR";
    return [...arr].sort((a, b) => {
      const aVal = key ? a[key] : a;
      const bVal = key ? b[key] : b;
      return aVal.localeCompare(bVal, turkishLocale);
    });
  },

  validateTCKN: (tckn) => {
    // Turkish Citizenship Number validation
    if (!/^\d{11}$/.test(tckn)) return false;
    if (tckn[0] === "0") return false;

    const digits = tckn.split("").map(Number);
    const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const sum2 = digits[1] + digits[3] + digits[5] + digits[7];

    const checkDigit1 = (sum1 * 7 - sum2) % 10;
    const checkDigit2 = (sum1 + sum2 + checkDigit1) % 10;

    return checkDigit1 === digits[9] && checkDigit2 === digits[10];
  },

  formatTurkishPhone: (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("90")) {
      const number = cleaned.substring(2);
      return `+90 ${number.substring(0, 3)} ${number.substring(
        3,
        6
      )} ${number.substring(6, 8)} ${number.substring(8)}`;
    }
    if (cleaned.startsWith("0")) {
      const number = cleaned.substring(1);
      return `0${number.substring(0, 3)} ${number.substring(
        3,
        6
      )} ${number.substring(6, 8)} ${number.substring(8)}`;
    }
    return phone;
  },
};

// Default export with main utilities
export default {
  ...utils,
  ecommerce: ecommerceUtils,
  turkish: turkishUtils,
};
