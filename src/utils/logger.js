/**
 * ANDA E-TİCARET LOGGER UTILITY
 *
 * Development ve production ortamları için güvenli logging sistemi
 * Console.log'ların production'da görünmemesi için wrapper
 */

import { supabase } from "../services/supabase";

// Environment kontrollü logging
const isDevelopment = import.meta.env.DEV;

/**
 * Logger class - production'da console.log'ları disable eder
 */
class Logger {
  constructor() {
    this.isDev = isDevelopment;
  }

  /**
   * Development log - sadece dev environment'ta çalışır
   */
  dev(...args) {
    if (this.isDev) {
      console.log("[DEV]", ...args);
    }
  }

  /**
   * Info log - her zaman çalışır ama production'da minimize
   */
  info(...args) {
    if (this.isDev) {
      console.info("[INFO]", ...args);
    } else {
      // Production'da sadece önemli bilgiler
      console.info(...args);
    }
  }

  /**
   * Warning log - her zaman çalışır
   */
  warn(...args) {
    console.warn("[WARN]", ...args);
  }

  /**
   * Error log - her zaman çalışır
   */
  error(...args) {
    console.error("[ERROR]", ...args);
  }

  /**
   * Debug log - sadece development'ta
   */
  debug(...args) {
    if (this.isDev) {
      console.debug("[DEBUG]", ...args);
    }
  }

  /**
   * Table log - sadece development'ta
   */
  table(data) {
    if (this.isDev && console.table) {
      console.table(data);
    }
  }

  /**
   * Group logging - sadece development'ta
   */
  group(label, callback) {
    if (this.isDev) {
      console.group(label);
      callback();
      console.groupEnd();
    } else {
      callback();
    }
  }

  /**
   * Time logging - sadece development'ta
   */
  time(label) {
    if (this.isDev) {
      console.time(label);
    }
  }

  timeEnd(label) {
    if (this.isDev) {
      console.timeEnd(label);
    }
  }

  /**
   * API request/response logging
   */
  api(method, url, data, response) {
    if (this.isDev) {
      this.group(`🌐 API ${method.toUpperCase()} ${url}`, () => {
        if (data) {
          console.log("📤 Request:", data);
        }
        if (response) {
          console.log("📥 Response:", response);
        }
      });
    }
  }

  /**
   * Database operation logging
   */
  db(operation, table, data) {
    if (this.isDev) {
      this.group(`🗄️ DB ${operation.toUpperCase()} ${table}`, () => {
        if (data) {
          console.log("Data:", data);
        }
      });
    }
  }

  /**
   * Authentication logging
   */
  auth(action, user) {
    if (this.isDev) {
      console.log(
        `🔐 Auth: ${action}`,
        user ? { id: user.id, email: user.email } : "No user"
      );
    }
  }

  /**
   * Performance logging
   */
  perf(label, duration) {
    if (this.isDev) {
      console.log(`⚡ Performance: ${label} took ${duration}ms`);
    }
  }

  /**
   * E-commerce specific logging
   */
  ecommerce = {
    order: (action, orderData) => {
      if (this.isDev) {
        console.log(`🛒 Order ${action}:`, orderData);
      }
    },

    payment: (action, paymentData) => {
      if (this.isDev) {
        // Payment data'yı güvenlik için minimize et
        const safeData = {
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: paymentData.status,
          method: paymentData.method,
        };
        console.log(`💳 Payment ${action}:`, safeData);
      }
    },

    product: (action, productData) => {
      if (this.isDev) {
        console.log(`📦 Product ${action}:`, {
          id: productData.id,
          name: productData.name,
          price: productData.price,
        });
      }
    },

    cart: (action, cartData) => {
      if (this.isDev) {
        console.log(`🛍️ Cart ${action}:`, cartData);
      }
    },

    user: (action, userData) => {
      if (this.isDev) {
        // User data'yı güvenlik için minimize et
        const safeData = {
          id: userData.id,
          email: userData.email,
          role: userData.role,
        };
        console.log(`👤 User ${action}:`, safeData);
      }
    },
  };
}

// Singleton instance oluştur
const logger = new Logger();

// Export both the class and instance
export default logger;
export { Logger };

// Convenience exports for direct usage
export const {
  dev,
  info,
  warn,
  error,
  debug,
  table,
  group,
  time,
  timeEnd,
  api,
  db,
  auth,
  perf,
  ecommerce,
} = logger;

/**
 * Uygulama loglarını Supabase app_logs tablosuna kaydeder.
 * @param {Object} param0 - Log parametreleri
 * @param {string} param0.log_level - Log seviyesi (info, warning, error, debug)
 * @param {string} param0.message - Log mesajı
 * @param {Object} param0.details - Ek detaylar (JSON)
 * @param {string} [param0.user_id] - Kullanıcı ID (isteğe bağlı)
 */
export async function logEvent({ log_level, message, details, user_id }) {
  try {
    await supabase
      .from("app_logs")
      .insert([{ log_level, message, details, user_id }]);
  } catch (e) {
    // Konsola da yaz, sessizce yutma
    console.error("Log kaydedilemedi:", e);
  }
}
